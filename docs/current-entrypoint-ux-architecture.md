# Current Entry Point UX and Architecture

This document maps the current Linkit entry point at `/` so the journey can be reviewed before adding the next feature.

## Scope

- Entry point: `app/page.tsx`
- Primary surface: public visual catalogue with infinite loading and link submission
- Secondary surfaces reached from entry point: post profile `/p/[postId]`, source redirect `/r/[postId]`, sign-in, settings
- Current stack: Next.js App Router, React client components, server actions, NextAuth, Drizzle, PostgreSQL, Redis, RabbitMQ, worker jobs, Sharp image processing, Mailgun notification delivery

## User Journey

```mermaid
journey
  title Current / Entry Point Journey
  section Arrive
    Open /: 5: Visitor
    See sticky nav and Catalogue rail: 4: Visitor
    Scan grouped visual feed: 5: Visitor
  section Browse
    Jump by provider in catalogue rail: 4: Visitor
    Scroll toward sentinel: 4: Visitor
    Auto-load or click More: 4: Visitor
    Reach End state: 3: Visitor
  section Open Item
    Click gallery tile: 5: Visitor
    View /p/[postId] profile page: 4: Visitor
    Read title, provider, comments, visits: 4: Visitor
    Click Visit source: 5: Visitor
  section Contribute
    Click Share: 4: Visitor
    Submit new link: 3: Visitor
    If signed out, receive sign-in prompt toast: 2: Visitor
    If signed in, post is created and feed revalidates: 5: Member
  section Discuss
    Add comment from profile page: 4: Member
    Reply to existing comment: 4: Member
    Receive toast feedback after redirect: 4: Member
```

## Entry Point Flow

```mermaid
flowchart TD
  A[User opens /] --> B[RootLayout]
  B --> C[SiteNav checks auth session]
  B --> D[HomePage server component]
  D --> E[getPublicGalleryFeedPage cached for 60s]
  E --> F{DATABASE_URL exists?}
  F -- No --> G[Render empty catalogue]
  F -- Yes --> H[Postgres store lists posts with thumbnails]
  H --> I[Build FeedItem view models]
  I --> J[GalleryFeed client component]
  J --> K[Catalogue rail grouped by provider]
  J --> L[Gallery sections and tiles]
  J --> M[Sentinel / More button]
  M --> N[/api/gallery?cursor=...]
  N --> O[Fetch next keyset page from Postgres]
  O --> P[Append deduped items]
  J --> Q[Submit dock]
  Q --> R[submitLink server action]
  R --> S{Authenticated?}
  S -- No --> T[Redirect /?message=...]
  S -- Yes --> U[Create post through Linkit service]
  U --> V[Revalidate public feed and /]
  V --> W[Redirect /?posted=1]
  T --> X[FeedbackBanner shows toast]
  W --> X
```

## Browse and Detail Flow

```mermaid
sequenceDiagram
  actor User
  participant Browser
  participant Home as / HomePage
  participant Gallery as GalleryFeed
  participant API as /api/gallery
  participant DB as PostgreSQL
  participant Profile as /p/[postId]
  participant Redirect as /r/[postId]

  User->>Browser: Open /
  Browser->>Home: Request entry point
  Home->>DB: listPostsPage(thumbnailsOnly)
  DB-->>Home: posts + nextCursor
  Home-->>Browser: Render initial catalogue
  Browser->>Gallery: Hydrate client feed
  User->>Gallery: Scroll near sentinel or click More
  Gallery->>API: GET /api/gallery?cursor=...
  API->>DB: listPostsPage(cursor, thumbnailsOnly)
  DB-->>API: next page
  API-->>Gallery: JSON items + nextCursor
  Gallery-->>Browser: Append deduped items
  User->>Browser: Click a tile
  Browser->>Profile: GET /p/[postId]
  Profile->>DB: findPostById + comments for post
  DB-->>Profile: post view model
  Profile-->>Browser: Render profile page
  User->>Browser: Click Visit source
  Browser->>Redirect: GET /r/[postId]
  Redirect->>DB: incrementPostClickCount
  Redirect-->>Browser: Redirect to original URL
```

## Submit Link Flow

```mermaid
sequenceDiagram
  actor Member
  participant Browser
  participant Action as submitLink server action
  participant Auth as NextAuth
  participant Runtime as Runtime services
  participant Service as Linkit service
  participant DB as PostgreSQL
  participant Queue as RabbitMQ or noop
  participant Toast as FeedbackBanner + Toast

  Member->>Browser: Submit URL from /#submit
  Browser->>Action: Form action submitLink(formData)
  Action->>Auth: auth()
  Auth-->>Action: session user or empty
  Action->>Runtime: createRuntimeServices()
  Runtime-->>Action: store, enqueue, metadataProvider
  alt signed out
    Action-->>Browser: redirect /?message=Sign in...
    Browser->>Toast: show informational toast
  else signed in
    Action->>Service: submitLink(link, user)
    Service->>DB: findPostByLink
    Service->>DB: createPost
    alt RabbitMQ configured
      Service->>Queue: enqueue link.enrich
    else no RabbitMQ
      Service->>Runtime: fetch OpenGraph metadata inline
      Service->>DB: createPost with metadata
      Service->>Queue: enqueue image.process noop
    end
    Action->>Action: revalidateTag public-feed and revalidatePath /
    Action-->>Browser: redirect /?posted=1
    Browser->>Toast: show success toast
  end
```

## System Architecture

```mermaid
flowchart LR
  subgraph Client["Browser"]
    Nav[Site nav]
    Feed[GalleryFeed client component]
    Comments[CommentSection client component]
    Toast[Feedback toast]
  end

  subgraph Next["Next.js App Router"]
    Layout[RootLayout]
    Home["/ app/page.tsx"]
    Profile["/p/[postId]"]
    Redirect["/r/[postId]"]
    GalleryAPI["GET /api/gallery"]
    CommentsAPI["GET /api/comments"]
    RepliesAPI["GET /api/comments/[commentId]/replies"]
    AuthAPI["/api/auth/[...nextauth]"]
    Actions[Server actions]
  end

  subgraph Domain["Domain and Infrastructure"]
    LinkitService[Linkit service]
    Runtime[Runtime service factory]
    Store[Drizzle LinkitStore]
    FeedLoader[Feed loaders and view models]
    RedisCache[Redis top-level comment cache]
    QueuePublisher[RabbitMQ publisher]
  end

  subgraph Worker["Background worker"]
    WorkerLoop[worker/index.ts]
    JobHandler[handleJob]
    Metadata[OpenGraph metadata provider]
    Images[Sharp image uploader]
    Mailer[Mailgun mailer]
  end

  subgraph Data["Persistence and external systems"]
    Postgres[(PostgreSQL)]
    Redis[(Redis)]
    Rabbit[(RabbitMQ)]
    Uploads[(public/uploads)]
    Web[External link pages]
    Mailgun[Mailgun API]
  end

  Client --> Layout
  Layout --> Nav
  Layout --> Home
  Home --> FeedLoader
  FeedLoader --> Store
  Feed --> GalleryAPI
  GalleryAPI --> FeedLoader
  Feed --> Profile
  Profile --> FeedLoader
  Profile --> Comments
  Comments --> CommentsAPI
  Comments --> RepliesAPI
  CommentsAPI --> RedisCache
  RepliesAPI --> Store
  Comments --> Actions
  Feed --> Actions
  Actions --> Runtime
  Runtime --> Store
  Runtime --> QueuePublisher
  Actions --> LinkitService
  LinkitService --> Store
  LinkitService --> QueuePublisher
  Redirect --> LinkitService
  Store --> Postgres
  RedisCache --> Redis
  QueuePublisher --> Rabbit
  Rabbit --> WorkerLoop
  WorkerLoop --> JobHandler
  JobHandler --> Metadata
  JobHandler --> Images
  JobHandler --> Mailer
  JobHandler --> Store
  Metadata --> Web
  Images --> Uploads
  Mailer --> Mailgun
  AuthAPI --> Postgres
  Nav --> AuthAPI
  Actions --> Toast
```

## Data Model Used by the Entry Point

```mermaid
erDiagram
  users ||--o{ posts : creates
  users ||--o{ comments : writes
  posts ||--o{ comments : has
  comments ||--o{ comments : replies

  users {
    uuid id PK
    int legacy_id
    text name
    text email UK
    text image
    text password_hash
    text username UK
    timestamp created_at
    timestamp updated_at
  }

  posts {
    uuid id PK
    int legacy_id
    uuid user_id FK
    text title
    text body
    text link UK
    text thumbnail_url
    text profile_thumbnail_url
    text provider_name
    int click_count
    int comments_count
    timestamp created_at
    timestamp updated_at
  }

  comments {
    uuid id PK
    int legacy_id
    uuid post_id FK
    uuid user_id FK
    text body
    uuid parent_id
    text reply_to_user_name
    int reply_count
    timestamp created_at
    timestamp updated_at
  }
```

## Current UX Observations

- The first screen is a catalogue, not a marketing landing page.
- Anonymous visitors can browse, open profiles, visit source links, and attempt to share.
- Signed-in members can share links, comment, reply, update settings, and sign out.
- Link submission feedback is redirect-driven: `/?posted=1` or `/?message=...` is converted to a toast by `FeedbackBanner`.
- The gallery only lists posts with `thumbnailUrl`, so submitted links without thumbnails may not appear in the visual entry feed until enrichment or image processing succeeds.
- Infinite loading has both an IntersectionObserver path and an explicit `More` button fallback.
- Top-level comments are Redis-cached for 60 seconds and invalidated after comment submission.

## Feature Extension Points

Use these hooks when adding a new feature so the change lands in the right layer.

| Feature type | Primary files | System impact |
| --- | --- | --- |
| Entry-point UI behavior | `app/page.tsx`, `components/gallery-feed.tsx`, `components/gallery-tile.tsx`, `app/globals.css` | Changes the public browse/share journey. Verify empty, loading, failed, and mobile states. |
| New post metadata field | `src/db/schema.ts`, `src/domain/linkit.ts`, `src/db/linkit-store.ts`, `src/feed/view-model.ts` | Requires migration, store mapping, and view model update before UI can consume it. |
| New server-side action | `app/actions.ts`, `src/server/posts.ts`, `src/domain/linkit.ts` | Add validation in domain/service layer, then wire redirects and feedback messages. |
| New async job | `src/domain/linkit.ts`, `src/queue/jobs.ts`, `src/worker/handlers.ts`, `src/worker/index.ts` | Add job type, routing key behavior, handler branch, tests, and dead-letter expectations. |
| Comment feature | `components/comment-section.tsx`, `app/api/comments/*`, `src/server/redis.ts`, `src/db/linkit-store.ts` | Consider Redis cache invalidation and reply count consistency. |
| Auth/account feature | `auth.ts`, `src/auth/config.ts`, `app/signin/*`, `app/register/*`, `app/settings/*` | Check anonymous and signed-in nav branches plus session-dependent server actions. |
| Feed query or ranking | `src/feed/load-feed.ts`, `src/feed/keyset.ts`, `src/db/linkit-store.ts` | Keep keyset pagination deterministic and make cursor compatibility explicit. |

## Suggested Next Feature Insertion Pattern

```mermaid
flowchart TD
  A[Define feature behavior] --> B{Does it change persisted data?}
  B -- Yes --> C[Update schema and migration]
  B -- No --> D[Keep data model unchanged]
  C --> E[Update Linkit domain types]
  D --> E
  E --> F[Update store contract and Postgres implementation]
  F --> G{Does it need async work?}
  G -- Yes --> H[Add job type, publisher path, worker handler]
  G -- No --> I[Use request/action path]
  H --> J[Expose via server action or route handler]
  I --> J
  J --> K[Update React component journey]
  K --> L[Add feedback, empty, loading, error states]
  L --> M[Add tests for domain, route/action, and UI-critical behavior]
  M --> N[Review updated UX journey diagram]
```

## Review Questions

- Should `/` remain a visual catalogue that filters to posts with thumbnails, or should new text-only submissions appear immediately somewhere?
- Should anonymous users be redirected to `/signin` when they submit, instead of receiving a toast on `/`?
- Should `Visit` on the profile page continue pointing through `/r/[postId]` to count visits, or should external source opening be separated from analytics?
- Should comments load server-side with the profile page for first paint, or stay client-loaded through `/api/comments` for cache flexibility?
- Which next feature should be treated as core journey work versus background enrichment work?
