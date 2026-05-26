# Linkit — Comment System Design

## Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-05-25 | ~~ltree + 2-level flatten~~ → **adjacency list + Redis + lazy-load** | ltree GiST write bottleneck; lazy-load UX preferred over eager full-thread load; Redis already needed for scale |

---

## Part 1 — Performance Analysis

### ltree bottleneck (why we moved away)

ltree stores full ancestry as a dotted-label path (`aabbcc.ddeeff.gghhii`). The GiST index enables fast subtree queries but is expensive to maintain under write load.

**Write cost:**

| Index type | Insert throughput (single core) | Concurrent insert ceiling |
|---|---|---|
| btree (`parent_id`) | ~8,000/s | ~2,000 TPS before lock contention |
| GiST (`path`) | ~800/s | ~200 TPS before contention |

GiST is ~10× slower per insert. At 200:1 read/write ratio the write tax is negligible for total latency — but under concurrent write spikes (viral post), GiST page locking degrades disproportionately.

**Read cost (ltree strength):**

```sql
-- Single non-recursive query, tree-ordered output
SELECT * FROM comments
WHERE post_id = $1
ORDER BY subpath(path, 0, 1), path;
```

No CTE, no recursion. Excellent for read-heavy workloads. The `subpath()` in ORDER BY cannot use an index for sorting (only filtering), so sort is in-memory after btree scan — fine for < 10K comments per post.

**Summary:** ltree is correct at low scale. Switching now for better write headroom and UX alignment.

---

### Effective response time model

**Assumptions:**
- Read/write ratio: 200:1
- Connection pool: 10 connections
- DB service time (read): 10ms (auth + query + React render)
- DB service time (write): 5ms

**Weighted average DB time:**

```
T_db = (200 × 0.7ms + 1 × 5ms) / 201 ≈ 0.72ms
```

Write penalty at 200:1 = 3.5% of weighted time. Negligible.

**Full request latency budget (per page render):**

```
Auth session lookup         ~5ms
listCommentsForPost()       ~0.7ms  (weighted)
flattenToTwoLevels()        ~0.05ms (O(n) in-memory)
React render (RSC)          ~3ms
JSON serialize + stream     ~1ms
──────────────────────────────────
Server total                ~10ms

Network (same region)       ~5ms
Network (cross-continent)   ~80ms
──────────────────────────────────
End-to-end (same region)    ~15ms
End-to-end (global)         ~90ms
```

**Connection pool queuing (M/M/c model):**

```
c = 10 connections
μ = 100 req/s per connection (10ms service time)
Capacity = c × μ = 1,000 req/s

ρ = λ / (c × μ)
```

| Load (req/s) | ρ | Queue wait | Effective T |
|---|---|---|---|
| 100 | 0.10 | ~0.01ms | ~10ms |
| 500 | 0.50 | ~0.5ms | ~10.5ms |
| 800 | 0.80 | ~8ms | ~18ms |
| 950 | 0.95 | ~95ms | ~105ms |

**Cliff at ρ = 0.80.** Above that, queue wait grows superlinearly. Key insight: because reads dominate, read latency controls ρ, not write latency. Any optimization to read path directly expands headroom.

**Redis cache impact** (TTL 60s, 1 write/min per post):

```
Cache hit rate ≈ (200 - 1) / 200 = 99.5%

T_read = 0.995 × 0.2ms + 0.005 × 30ms
       = 0.199ms + 0.15ms
       ≈ 0.35ms
```

Effective capacity with Redis: pool contention effectively disappears for comment reads.

---

## Part 2 — Data Structure Comparison

### Adjacency list

Each node stores only its direct parent pointer.

```
id    parent_id    body
────  ───────────  ──────────────────
A     NULL         "Root comment"
B     A            "Reply to root"
C     A            "Another reply"
D     B            "Reply to B"
E     D            "Deep reply"
```

Tree shape:
```
A
├── B
│   └── D
│       └── E
└── C
```

**Write:** `INSERT` with btree index on `parent_id`. O(log n), ~1ms.

**Read (naive):** Recursive CTE walks depth levels sequentially.

```sql
WITH RECURSIVE thread AS (
  SELECT id, parent_id, body, 1 AS depth
  FROM comments
  WHERE post_id = $1 AND parent_id IS NULL

  UNION ALL

  SELECT c.id, c.parent_id, c.body, t.depth + 1
  FROM comments c
  JOIN thread t ON c.parent_id = t.id
)
SELECT * FROM thread ORDER BY depth, id;
```

O(depth) sequential passes. For depth 10: 10 index scans. Fast with indexed `parent_id` but still recursive.

**Read (with Redis):** No recursive CTE at read time. Postgres only serves cache misses.

**Application-layer tree build (O(n)):**

```typescript
function buildTree(rows: Row[]): TreeNode[] {
  const byId = new Map(rows.map(r => [r.id, { ...r, children: [] }]));
  const roots: TreeNode[] = [];
  for (const row of rows) {
    if (row.parent_id === null) {
      roots.push(byId.get(row.id)!);
    } else {
      byId.get(row.parent_id)?.children.push(byId.get(row.id)!);
    }
  }
  return roots;
}
```

Requires all nodes fetched before structure is known — solved by lazy-load UX (never fetch entire tree at once).

### Complexity comparison

| Operation | Adjacency list | ltree |
|---|---|---|
| Insert | O(log n) btree | O(log n) GiST (10× slower constant) |
| Find all descendants | O(n × depth) recursive CTE | O(log n) single scan |
| Find path to root | O(depth) walk | O(1) — path IS the answer |
| Move subtree | O(1) update parent_id | O(subtree size) update all paths |
| Sort by score | encode in sort_key | not supported natively |

---

## Part 3 — Industry Patterns

### Facebook — TAO graph store

Not a comment table. TAO (The Associations and Objects) is a graph store sharded across MySQL.

```
Objects: { id, type, data }     → Comment, Post, User
Assocs:  { id1, type, id2 }     → POST_HAS_COMMENT, COMMENT_REPLY_TO
```

Comment thread = graph traversal. TAO two-tier memcache handles hot content — no SQL at read time. UI flattens to 1 visible reply level. Technically unlimited depth stored.

### YouTube — Spanner + Bigtable

```sql
comments (
  video_id STRING,
  comment_id STRING,
  parent_id STRING,       -- adjacency list
  created_at TIMESTAMP
) PRIMARY KEY (video_id, comment_id)  -- interleaved, co-located
```

Bigtable: hot video comments by reverse timestamp. Spanner: full thread on expand. Replies loaded lazily per parent (lazy-load model).

### Instagram — Cassandra + flat list

```
comments_by_media (
  media_id UUID,
  created_at TIMEUUID,
  comment_id UUID
) PARTITION KEY (media_id) CLUSTERING KEY (created_at DESC)
```

No nested replies in storage. "Replies" = root comment with `@username` prepended + `reply_to_comment_id` tag. Flat scan by time. No tree construction needed. Cassandra = write-optimized at the cost of query flexibility.

### Twitter/X — Manhattan KV + conversation_id

```
tweet: {
  id: snowflake,
  in_reply_to_tweet_id,
  conversation_id    -- root tweet ID for entire thread
}
```

Thread fetch = `WHERE conversation_id = $root_id`. No recursive walk. Score computed offline by Heron/Storm. Redis sorted sets for timeline caches.

### Reddit — adjacency list + materialized sort_key + Redis

```
comments: { id, parent_id, sort_key, score, body }
```

`sort_key` precomputed at write time: encodes full ancestry + score rank as sortable string. `ORDER BY sort_key` = single btree scan, no recursion, score-ranked. Redis caches serialized thread JSON per post per sort mode (top/new/controversial). Invalidated on any comment insert or vote.

### Pattern summary

| | Storage | Nesting model | Cache | Sort |
|---|---|---|---|---|
| Facebook | TAO graph (MySQL) | True graph, UI 1-level | Two-tier memcache | Edge time |
| YouTube | Spanner + Bigtable | Adjacency list, lazy replies | Bigtable hot path | Spanner SQL |
| Instagram | Cassandra | Flat + `reply_to_id` tag | Cassandra IS the cache | `created_at` cluster |
| Twitter | Manhattan KV | `conversation_id` grouping | Redis timelines | Offline score |
| Reddit | Postgres adjacency | Adjacency + `sort_key` | Redis per-thread JSON | Materialized sort_key |
| **Linkit target** | Postgres adjacency | Adjacency, lazy-load replies | Redis thread JSON | `created_at` |

**Common across all five:**
1. No recursive SQL at read time in hot path — everyone pre-computes or caches
2. UI collapses deep nesting — only Reddit renders unlimited depth
3. Separate hot (cache/fast-write) and cold (durable SQL) storage at scale
4. Root-level grouping for single-query thread fetch

---

## Part 4 — New Design: Adjacency List + Redis + Lazy-Load

### Philosophy

> Storage: minimal and fast (parent_id, btree only).
> Cache: Redis thread JSON, invalidated on write.
> UX: lazy-load replies on expand (YouTube/Instagram style).

### Schema

```sql
-- Existing comments table, add parent_id, drop path
ALTER TABLE comments
  ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE SET NULL,
  DROP COLUMN path,
  DROP COLUMN reply_to_user_id;

-- Index for tree walking and cache invalidation
CREATE INDEX comments_parent_id_idx ON comments (parent_id);
CREATE INDEX comments_post_parent_idx ON comments (post_id, parent_id);
```

`reply_to_user_id` → can be kept as denormalized `reply_to_user_name text` for @mention display (no join needed).

### Write path

```
1. INSERT comment (parent_id, btree) → ~1ms
2. DEL redis:thread:{post_id}:top-level  → 0.1ms  (invalidate cache)
3. Enqueue comment.notify job
```

No GiST. No path recompute. Fastest possible insert.

### Read path — top-level (initial page load)

```sql
SELECT c.id, c.body, c.created_at, c.reply_count,
       u.username, u.name, u.image
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.post_id = $1 AND c.parent_id IS NULL
ORDER BY c.created_at ASC
LIMIT 20;
```

No recursion. Returns root comments only. Cached in Redis.

```
key:   thread:{post_id}:top-level
value: JSON array of root comment objects
TTL:   60s (hot posts), 300s (cold posts)
```

### Read path — replies (lazy, on expand)

```sql
SELECT c.id, c.body, c.created_at,
       u.username, u.name, u.image,
       c.reply_to_user_name
FROM comments c
JOIN users u ON c.user_id = u.id
WHERE c.parent_id = $parent_id
ORDER BY c.created_at ASC;
```

Fires only when user clicks "N replies". Not cached (low volume per parent, invalidation complex).

### Cache strategy

```
Write flow:
  INSERT comment
  → DEL redis:thread:{post_id}:top-level
  (replies not cached — small N, invalidation simple)

Read flow (top-level):
  GET redis:thread:{post_id}:top-level
  HIT  → deserialize + return
  MISS → Postgres query → app buildTree() → SET redis (TTL 60s) → return

Hit rate at 200:1, 60s TTL, 1 write/min:
  ≈ 99.5%

Effective read time:
  0.995 × 0.2ms + 0.005 × 30ms ≈ 0.35ms
```

### UI — lazy-load expand

```
Initial render:
  [Root comment A]           [N replies ▼]
  [Root comment B]           [2 replies ▼]
  [Root comment C]

On click "N replies ▼":
  → fetch /api/comments/{commentId}/replies
  → render inline, indented
  → "Reply" button per reply
```

Replies to replies load same way. No depth cap enforced in storage; UI just loads one level at a time.

### reply_count denormalization

Store `reply_count int DEFAULT 0` on each comment. Increment on child insert. Allows "N replies" label without a COUNT query. Same pattern as `comments_count` on posts.

```sql
ALTER TABLE comments ADD COLUMN reply_count int NOT NULL DEFAULT 0;
```

### Migration from current ltree implementation

Current state: `path ltree`, `reply_to_user_id` columns exist from slice 25.

Migration:

```sql
-- drizzle/0002_adjacency_list.sql

-- Add new columns
ALTER TABLE comments
  ADD COLUMN parent_id uuid REFERENCES comments(id) ON DELETE SET NULL,
  ADD COLUMN reply_to_user_name text,
  ADD COLUMN reply_count int NOT NULL DEFAULT 0;

-- Backfill parent_id from ltree path
-- path depth 1 = root (parent_id stays NULL)
-- path depth 2+ = parent is subpath(path, 0, nlevel-1)
-- Implementation: app-level backfill script (path→UUID lookup)

-- Indexes
CREATE INDEX comments_parent_id_idx ON comments (parent_id);
CREATE INDEX comments_post_parent_idx ON comments (post_id, parent_id);

-- After backfill verified:
ALTER TABLE comments DROP COLUMN path;
ALTER TABLE comments DROP COLUMN reply_to_user_id;
DROP EXTENSION IF EXISTS ltree;
```

Backfill script: `scripts/migrate-ltree-to-adjacency.ts`
- Fetch all comments with `path` containing `.`
- Parse parent UUID from `subpath(path, 0, nlevel-1)` → strip hyphens → reverse lookup to comment id
- UPDATE `parent_id` for each

### New API routes

```
GET /api/comments?postId={id}              → top-level comments (Redis-cached)
GET /api/comments/{commentId}/replies      → direct children of a comment
POST /api/comments                         → create comment (body, postId, parentId?)
```

### Files to change

| File | Change |
|---|---|
| `src/db/schema.ts` | Replace `path ltree` + `replyToUserId uuid` with `parentId uuid` + `replyToUserName text` + `replyCount int` |
| `drizzle/0002_adjacency_list.sql` | Migration: add parent_id, backfill, drop ltree cols |
| `scripts/migrate-ltree-to-adjacency.ts` | Backfill script for existing path data |
| `src/domain/linkit.ts` | Update `LinkitComment` type, `CreateStoredCommentInput`, `LinkitStore` |
| `src/db/linkit-store.ts` | Rewrite `createComment`, `listCommentsForPost` → `listTopLevelComments` + `listRepliesForComment` |
| `src/feed/view-model.ts` | Remove `flattenToTwoLevels`/`toFlatComments`; add `toCommentCards` for top-level |
| `app/p/[postId]/page.tsx` | Render top-level only; lazy-load replies client-side |
| `app/api/comments/route.ts` | New: GET top-level (Redis-cached), POST create |
| `app/api/comments/[commentId]/replies/route.ts` | New: GET replies for a parent |
| `src/server/redis.ts` | New: Redis client + thread cache helpers |
| `src/server/posts.ts` | Update `submitCommentFromForm` — `parentId` instead of `parentCommentPath` |

### Redis setup

Add to Docker Compose:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 5s
    timeout: 3s
    retries: 5
```

Add `REDIS_URL=redis://localhost:6379` to `.env.example`.
Client: `ioredis` or `redis` npm package.

### Tests to add

- `tests/db/linkit-store.test.ts` — `listTopLevelComments`, `listRepliesForComment`, `reply_count` increment
- `tests/server/comments.test.ts` — cache hit/miss behavior, invalidation on insert
- `tests/feed/view-model.test.ts` — `toCommentCards` authorName fallback
- `tests/server/posts.test.ts` — reply with `parentId` builds correct parent link

### Verification

```bash
npx tsc --noEmit
npx vitest run
DATABASE_URL=postgres://linkit:linkit@localhost:55432/linkit npm run db:migrate
DATABASE_URL=... tsx scripts/migrate-ltree-to-adjacency.ts
```

Manual:
1. Post → add root comment → shows immediately
2. Click "N replies" → replies load inline without page refresh
3. Reply to reply → stored as child of parent comment, loads under same thread
4. Viral post simulation: rapid inserts → no GiST contention
5. Redis miss → Postgres → cached → subsequent loads < 1ms
