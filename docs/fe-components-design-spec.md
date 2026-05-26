# Frontend Components Design Spec

Covers the gallery modal, gallery layout, comment section, and auth UX patterns introduced in slices 33–35 (`feat/rewrite-fe`).

---

## 1. ExpandedCard — FLIP Modal

**File:** `components/expanded-card.tsx`

### Purpose

Opens a gallery tile as a centered detail panel with a smooth FLIP (First, Last, Invert, Play) animation that gives the impression of the card "expanding" into the modal.

### Animation

1. On mount, read `cardRect` (the tile's `DOMRect` passed in from `onExpand`).
2. Compute final panel geometry (`panelLeft`, `panelTop`, `panelWidth`, `panelHeight`).
3. Apply start state — `translate(dx, dy) scale(scaleX, scaleY)` — so the panel visually sits on the card.
4. Two `requestAnimationFrame` calls later, clear the transform and fire the CSS transition:
   - Transform: `cubic-bezier(0.16, 1, 0.3, 1)` 340 ms (spring-like overshoot feel).
   - Opacity: `ease` 180 ms.
5. `didAnimateRef` prevents re-triggering on re-renders.

### Panel sizing

- `PANEL_WIDTH = 820 px` (capped at `viewport.width - 32`).
- Image column = half the panel width on desktop, full width on mobile (`<= 767 px`).
- Panel height derived from the thumbnail's natural aspect ratio (`imageColumnWidth / aspectRatio`).
- Clamped: `max(imageBasedHeight, min(MIN_PANEL_HEIGHT=520, maxPanelHeight))` and `min(..., maxPanelHeight)`.
- `maxPanelHeight = viewport.height - navBottom - PANEL_MARGIN*2`.
- Panel centered: `left = (viewport.width - panelWidth) / 2`, `top = navBottom + (availableHeight - height) / 2`.

### Backdrop

```
background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(12,10,8,0.34)), rgba(12,10,8,0.32)
backdrop-filter: blur(18px) saturate(1.35)
```

Click on backdrop → close. ESC key → close. Body `overflow: hidden` while open.

### Panel structure

```
card-expand-panel (role=dialog, aria-modal)
  card-expand-inner (flex row / column on mobile)
    card-expand-image
      GalleryThumb
    card-expand-detail (flex column, overflow hidden)
      card-expand-header
        card-expand-actions (close button, visit link)
        profile-source (provider name)
        card-expand-title
        card-expand-meta (comments count, visits count dl)
      card-expand-comments (scrollable)
        CommentSection
```

### Rendering

Rendered via `createPortal(modal, document.body)` — escapes any overflow/stacking context.

---

## 2. Gallery Layout — JS Column Distribution

**File:** `components/gallery-feed.tsx` → `distributeColumns` + `GallerySection`

### Problem with CSS columns

CSS `columns: 3` fills column 1 completely before starting column 2. Infinite-scroll appends cause items to jump between columns as the total count changes, breaking perceived stability.

### Solution

```ts
function distributeColumns(items: FeedItem[]): FeedItem[][] {
  const cols = Array.from({ length: COLUMN_COUNT }, () => []);
  const heights = new Array<number>(COLUMN_COUNT).fill(0);
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(item);
    heights[shortest]++;
  }
  return cols;
}
```

- Shortest-column (count as height proxy) ensures even distribution.
- Same input order → same column assignment; appending never moves existing items.
- Rendered as `<div class="gallery-column">` wrappers inside `<div class="gallery-section-grid">`.
- Desktop: 3 columns. Mobile (`<= 767 px`): 2 columns (via CSS media query on `.gallery-section-grid`).

### Catalogue rail

The left `catalogue-rail` is derived from `stageGroups` (the already-computed provider→items map):

```ts
const catalogueGroups = useMemo(() =>
  stageGroups
    .map(([provider, groupItems]) => ({ providerName: provider, count: groupItems.length }))
    .sort((a, b) => a.providerName.localeCompare(b.providerName)),
  [stageGroups]
);
```

No extra DB fetch. Every catalogue entry has a matching `#section-{slugify(provider)}` DOM id, so `scrollIntoView` always resolves.

Active-section tracking uses `IntersectionObserver` on `.gallery-section` elements with `rootMargin: "-60px 0px -65% 0px"`.

---

## 3. Comment Section — Virtual Scroll + Lazy Replies

**File:** `components/comment-section.tsx`

### Layout

```
comment-section
  [compose form — always at TOP]
  comment-list
    CommentItem × BATCH
    [sentinel div — IntersectionObserver trigger]
```

Compose at top keeps the "write" action immediately accessible without scrolling through existing comments.

### Virtual scroll (root comments)

- `BATCH = 10` comments per load.
- `IntersectionObserver` watches the sentinel `div` at the end of the rendered list.
- When sentinel enters viewport: `setVisible(prev => prev + BATCH)`.
- Comments are sliced from the full `comments` array — no secondary fetch for pagination.
- Root comments fetched once on mount via `GET /api/comments?postId=X` (Redis-cached).

### Lazy reply expand

- Each root comment shows a "View N replies" button when `comment.replyCount > 0`.
- Click: `fetch /api/comments/{id}/replies` → `setReplies(data)` → `setExpanded(true)`.
- `useTransition` wraps the fetch so the button shows a pending state without blocking the UI.
- Reply form: toggled via `setShowReplyForm`; submits `submitComment` action with hidden `parentId` / `replyToUserName` fields; on success re-fetches replies to refresh the expanded list.

### Anonymous display

```ts
authorName: (c.user as { username?: string | null }).username ?? "Anonymous"
```

---

## 4. Auth UX — PasswordInput + Field-Selective Clear

### PasswordInput component

**File:** `components/password-input.tsx`

Controlled input with inline SVG eye-toggle:

```tsx
<div className="relative flex items-center border-b border-ink">
  <input type={show ? "text" : "password"} ... />
  <button type="button" aria-label={show ? "Hide password" : "Show password"}>
    {show ? <EyeClosed /> : <EyeOpen />}
  </button>
</div>
```

- `EyeOpen` / `EyeClosed`: inline SVG, `16×16`, `stroke="currentColor"`.
- Toggle button is `type="button"` to avoid form submission.
- `flex-1` on input, `shrink-0` on button.

### Field-selective clear on error

Server actions return `{ error: string; field?: "email" | "password" }`. The client clears only the field that caused the error:

```ts
useEffect(() => {
  if (state?.error) {
    showToast(state.error, "error");
    if (state.field === "password") setPassword("");
    else if (state.field === "email") setEmail("");
  }
}, [state]);
```

This preserves valid field values (e.g., email stays filled when only the password was wrong).

### Auth page layouts

- **Sign-in / Register**: single centered `max-w-sm` column. Removed previous 2-column layout.
- **Profile/Settings**: `mx-auto max-w-md` container.
- Form inputs: bottom-border only (`border-b border-ink`), transparent background, `text-base normal-case tracking-normal` — departs from the site-wide uppercase tracking to improve readability in data-entry fields.

---

## Component interaction diagram

```
GalleryFeed
  ├── catalogue-rail (derived from stageGroups)
  ├── infinite-stage
  │     └── GallerySection[] (per provider)
  │           └── gallery-section-grid
  │                 └── gallery-column[] × 3
  │                       └── GalleryTile (button, onExpand)
  └── ExpandedCard (portal → body, rendered when expanded ≠ null)
        ├── GalleryThumb
        └── CommentSection
              ├── compose form (top)
              └── CommentItem[]
                    └── reply form (lazy, per root comment)
```
