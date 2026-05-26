# Linkit Next.js Project Guide

This project uses Next.js with the App Router. The main idea is that the
`app/` folder defines routes by folder name, while `src/` contains the business
logic that those routes call.

## Folder Map

- `app/` - website pages, API endpoints, layouts, and server actions.
- `components/` - reusable React UI pieces.
- `src/domain/` - core Linkit rules, independent of Next.js and Postgres.
- `src/db/` - Drizzle schema and Postgres-backed store implementation.
- `src/feed/` - transforms stored posts/comments into gallery/profile view data.
- `src/server/` - server workflows used by actions and routes.
- `src/worker/` - RabbitMQ background job worker.
- `tests/` - Vitest unit/integration tests and Playwright browser tests.

## App Router Basics

In Next.js App Router, special filenames inside `app/` have meaning:

- `page.tsx` renders a browser page.
- `layout.tsx` wraps child pages.
- `route.ts` handles HTTP requests for APIs or redirects.
- `loading.tsx`, `error.tsx`, and `not-found.tsx` are optional route states.

Folders become URL segments:

| File | URL | What it does |
| --- | --- | --- |
| `app/page.tsx` | `/` | Home gallery page |
| `app/signin/page.tsx` | `/signin` | Sign-in page |
| `app/register/page.tsx` | `/register` | Registration page |
| `app/p/[postId]/page.tsx` | `/p/abc` | Profile/detail page for post `abc` |
| `app/r/[postId]/route.ts` | `/r/abc` | Counts a visit, then redirects to the original link |
| `app/api/gallery/route.ts` | `/api/gallery` | JSON API for infinite scroll |
| `app/api/auth/[...nextauth]/route.ts` | `/api/auth/...` | Auth.js catch-all auth endpoints |

## What `[postId]` Means

A folder wrapped in square brackets is a dynamic route segment.

`app/p/[postId]/page.tsx` matches URLs like:

- `/p/00000000-0000-0000-0000-000000000002`
- `/p/my-post-id`

Inside the page, Next.js passes the segment through `params`:

```tsx
export default async function ProfilePage({
  params
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
}
```

In this app, `postId` is used to load one saved link from Postgres. If the post
does not exist, the page calls `notFound()`, so Next.js renders a 404.

## Why the Folder Is Named `p`

`p` is not a Next.js keyword. It is just a product URL choice.

In Linkit:

- `/p/[postId]` means "profile/detail page for this saved post".
- `/r/[postId]` means "redirect through Linkit for this post".

The short names keep public URLs compact:

- `/p/123` shows the Linkit detail page.
- `/r/123` increments visit count and redirects to the external article.

## Page vs Route

Use `page.tsx` when the browser should see HTML.

Example: `app/p/[postId]/page.tsx` returns React UI:

```tsx
return (
  <main className="profile-page">
    ...
  </main>
);
```

Use `route.ts` when you need an HTTP handler.

Example: `app/api/gallery/route.ts` returns JSON:

```ts
export async function GET(request: Request) {
  return NextResponse.json({ items, nextCursor });
}
```

Example: `app/r/[postId]/route.ts` redirects:

```ts
export async function GET(_request: Request, { params }) {
  const { postId } = await params;
  redirect(redirectUrl);
}
```

## Server Components and Client Components

By default, components in the `app/` folder are Server Components. They run on
the server and can read environment variables, query Postgres, and call server
logic directly.

Example: `app/page.tsx` loads the first gallery page on the server:

```tsx
const galleryPage = await getPublicGalleryFeedPage();
```

Client Components run in the browser. They need `"use client"` at the top and
can use hooks like `useState`, `useEffect`, and browser APIs.

Example: `components/gallery-feed.tsx` is a Client Component because it handles
infinite scroll with `IntersectionObserver` and `fetch`.

## Server Actions

Server actions let a form call server code directly.

In `app/page.tsx`:

```tsx
<form action={submitLink}>
```

`submitLink` lives in `app/actions.ts`. It runs on the server, checks auth,
writes to Postgres, enqueues RabbitMQ work, and redirects back with feedback.

## Data Flow For The Gallery

The home page flow is:

1. `app/page.tsx` calls `getPublicGalleryFeedPage()`.
2. `src/feed/load-feed.ts` asks the store for one keyset-paginated page.
3. `src/db/linkit-store.ts` queries Postgres using Drizzle.
4. `src/feed/view-model.ts` converts DB/domain objects into UI-friendly items.
5. `components/gallery-feed.tsx` renders the first page.
6. When the scroll sentinel enters view, the browser calls `/api/gallery`.
7. `app/api/gallery/route.ts` returns the next page and next cursor.

## Data Flow For A Profile Page

The profile page flow is:

1. Browser visits `/p/[postId]`.
2. `app/p/[postId]/page.tsx` reads `postId` from `params`.
3. It creates a Postgres store.
4. `getProfileFeedItemFromStore()` loads that exact post and its comments.
5. The page renders image, title, visit count, comments, and a comment form.

## Data Flow For Redirects

The redirect flow is:

1. Browser visits `/r/[postId]`.
2. `app/r/[postId]/route.ts` reads `postId` from `params`.
3. It increments the post visit count.
4. It revalidates cached gallery/profile data.
5. It redirects the browser to the original external URL.

## Technologies Used

- Next.js - routing, server rendering, API routes, server actions.
- React - UI components.
- TypeScript - type safety.
- Auth.js - sign-in/session/authentication.
- Drizzle ORM - typed SQL queries.
- Postgres - database.
- RabbitMQ plus `amqplib` - background jobs.
- Caddy - HTTPS reverse proxy in Docker Compose.
- Vitest - unit/integration tests.
- Playwright - browser tests.

## Good Files To Read First

Start in this order:

1. `app/layout.tsx` - global shell and persistent navigation.
2. `app/page.tsx` - home page and server-loaded first gallery page.
3. `components/gallery-feed.tsx` - browser-side infinite scroll.
4. `app/api/gallery/route.ts` - JSON API used by infinite scroll.
5. `app/p/[postId]/page.tsx` - dynamic profile route.
6. `app/r/[postId]/route.ts` - dynamic redirect route.
7. `src/domain/linkit.ts` - core app rules.
8. `src/db/linkit-store.ts` - Postgres implementation.

## Mental Model

Think of the app like this:

- `app/` decides "what URL is this?"
- `components/` decides "what does it look like?"
- `src/domain/` decides "what are the business rules?"
- `src/db/` decides "how do we store and load data?"
- `src/server/` decides "what server workflow should happen?"
- `src/worker/` decides "what work happens later in the background?"

