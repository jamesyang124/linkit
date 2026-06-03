# Linkit — Architecture Decisions

## Comment Storage: Adjacency List + Redis

**Decision:** Use adjacency list (`parent_id` btree) + Redis thread cache + lazy-load UX.

**Rejected:** `ltree` GiST extension.

**Why ltree lost:** GiST inserts run ~10× slower than btree (`~800/s` vs `~8,000/s`). Under concurrent write spikes, GiST page locking degrades disproportionately. The recursive CTE strength of ltree (single-pass full-thread query) is only relevant if the full thread is loaded eagerly — our lazy-load UX never loads the full tree at once.

**Current design:**

```
Write:  INSERT comment (btree ~1ms) → DEL redis:thread:{postId}:top-level → enqueue notify
Read:   GET redis:thread:{postId}:top-level (HIT ~0.2ms) or Postgres SELECT root comments (MISS ~30ms)
Replies: lazy fetch GET /api/comments/{id}/replies on expand click
```

Redis TTL 60s. Hit rate at 200:1 read/write ≈ 99.5%. Effective read latency ≈ 0.35ms.

`reply_count` denormalized on comment row — no COUNT query needed for "N replies" label.

This matches the YouTube/Reddit pattern: never load full thread eagerly, cache the hot read path, lazy-load depth.

---

## Gallery Pagination: Keyset over Offset

**Decision:** Keyset pagination using `(providerName, createdAt, id)` cursor, not `OFFSET/LIMIT`.

**Why:** OFFSET scans grow proportionally with page depth. With 900+ posts, page 30 would scan 870 discarded rows. Keyset uses an index seek directly to the cursor position.

**Global feed cursor:** ordered `(providerName ASC, createdAt DESC, id DESC)`. The cross-provider keyset condition:

```sql
WHERE (providerName > cursor.providerName)
   OR (providerName = cursor.providerName AND (createdAt < cursor.createdAt OR (createdAt = cursor.createdAt AND id < cursor.id)))
```

**Per-provider cursor:** when `providerFilter` is set, ordering simplifies to `(createdAt DESC, id DESC)` — `providerName` in cursor is still encoded but only `createdAt` and `id` drive the keyset condition. The cursor token is the same type; the receiver uses a different branch.

**Cursor encoding:** base64url JSON containing `{ providerName, createdAt, id }`. Validated on decode (structure only — not against the active provider filter).

---

## Gallery Post Visibility: Thumbnail-Only

**Decision:** `listPostsPage` and `listPostsByProvider` filter to `thumbnailUrl IS NOT NULL`.

**Why:** The gallery is image-forward. Posts submitted by users are processed async (OpenGraph + Cloudinary). Showing unprocessed posts creates empty grid slots with no visual. Posts appear in the feed only after enrichment + image processing completes. The submit form closes immediately on success; no optimistic pending tile is shown.

---

## Session Strategy: JWT

**Decision:** Auth.js `session.strategy = "jwt"`.

**Why forced:** Auth.js v5 with the credentials provider requires JWT sessions. Database sessions are not supported with credentials auth in v5.

---

## Dev HTTPS: Caddy Internal TLS

**Decision:** Use `https://localhost:8443` as the default dev browser URL, not `http://localhost:3000`.

**Why:** Matches production TLS behavior. Auth.js secure cookies, HSTS, and browser security features behave correctly only over HTTPS. Caddy's internal CA (`tls internal`) generates a self-signed cert automatically.

`allowedDevOrigins: ["127.0.0.1"]` in `next.config.mjs` is required for React hydration to work when accessing the app through the Caddy proxy at `127.0.0.1:8080`.
