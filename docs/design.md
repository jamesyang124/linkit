# Linkit — Design

## Visual References

- Andrés Briganti infinite-scroll: https://www.awwwards.com/inspiration/infinite-scroll-andres-briganti
- Andrés Briganti info page: https://www.awwwards.com/inspiration/info-page-andres-briganti
- Live portfolio: https://www.briganti.works/work
- Pinterest detail: https://www.pinterest.com/pin/4597753120114557184/

## Principles

- **Catalogue, not dashboard.** First screen is the visual link feed — no marketing copy, no hero.
- **Pale canvas, restrained contrast.** Fine grid lines, one restrained accent, monochrome base.
- **Typography-first hierarchy.** Strong type scale without oversized copy.
- **Sparse navigation.** Top-right anchor, no heavy sidebars.
- **Progressive enhancement animations.** Reduced-motion respected everywhere; CSS transitions only, no animation frameworks.

## Layout

- **Left rail** — provider catalogue, alphabetically sorted, click filters the feed. Sticky horizontal chip bar on mobile (≤767 px).
- **Gallery grid** — 3 columns JS-distributed (see below). Mobile: 2-column CSS column layout.
- **Right rail** — tag filter.
- Sidebar uses `position: fixed`; main gallery area scrolls independently via `#page-main` (`overflow-y: auto`).

## Design Tokens (CSS variables)

Key variables in `app/globals.css`:

```css
--c-surface        /* page background */
--c-surface-2      /* image placeholder bg, secondary surfaces */
--c-ink            /* primary text */
--c-muted          /* secondary text */
--c-border-mid     /* dividers */
```

Five themes: Linen (default), Mocha, Sage, Slate, Noir. Stored in `localStorage`, applied via `data-theme` on `<html>`. FOUC-prevention inline script in `app/layout.tsx`.

---

## Gallery Tile

Gallery thumbnails use a **fixed `aspect-ratio: 16/10`** container with `overflow: hidden`. The image is absolutely positioned (`inset: 0; object-fit: cover`) so the container height is always reserved before the image loads — no layout shift.

Fade-in on load via `gallery-thumb-loaded` class added by `GalleryThumb` after `onLoad`:

```css
.gallery-thumb-img { opacity: 0; transition: opacity 400ms ease; }
.gallery-thumb-loaded .gallery-thumb-img { opacity: 1; }
```

Hover: `::after` overlay `rgba(10,10,10,0.12)` + subtle transform on parent.

---

## JS Column Distribution

CSS `columns` fills column 1 before column 2 — items jump when new content appends. Instead, `distributeColumns` assigns items to the shortest column by count:

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

Same input order → same assignment. Appending never moves existing items. Rendered as `gallery-column` wrappers inside `gallery-section-grid`.

---

## ExpandedCard — FLIP Modal

`components/expanded-card.tsx` opens a gallery tile as a centered panel with a FLIP animation (the card appears to "expand" into the modal).

**Animation flow:**
1. Read `cardRect` (tile's `DOMRect` from `onExpand`).
2. Compute final panel geometry: `PANEL_WIDTH = 820 px` (capped at `viewport.width - 32`); height from image aspect ratio, clamped to viewport.
3. Apply start transform `translate(dx, dy) scale(sx, sy)` — places panel visually on the card.
4. Two rAF ticks later, clear transform and play CSS transition:
   - Transform: `cubic-bezier(0.16, 1, 0.3, 1)` 340 ms (spring feel)
   - Opacity: `ease` 180 ms
5. `didAnimateRef` prevents re-triggering on re-renders.

**Backdrop:**
```css
background: linear-gradient(135deg, rgba(255,255,255,0.18), rgba(12,10,8,0.34)), rgba(12,10,8,0.32);
backdrop-filter: blur(18px) saturate(1.35);
```

Click backdrop or ESC → close. Rendered via `createPortal(modal, document.body)`.

**Panel structure:**
```
card-expand-panel (role=dialog, aria-modal)
  card-expand-inner (flex row; column on mobile)
    card-expand-image       ← GalleryThumb, half panel width
    card-expand-detail      ← flex column, overflow hidden
      card-expand-header    ← close, visit link, title, meta
      card-expand-comments  ← scrollable CommentSection
```

Mobile (`≤767 px`): full-viewport bottom sheet, slides up from bottom.

---

## Comment Section — Virtual Scroll + Lazy Replies

`components/comment-section.tsx`

**Layout:** compose form at top (always visible without scrolling), then root comments, then scroll sentinel.

**Virtual scroll (root comments):**
- Fetch all root comments once on mount via `GET /api/comments?postId=X` (Redis-cached, 60s TTL).
- `BATCH = 10` rendered at a time; `IntersectionObserver` on the sentinel advances visible count.
- Client-side slice — no secondary pagination fetch.

**Lazy reply expand:**
- "View N replies" button per root comment (visible when `replyCount > 0`).
- Click: `fetch /api/comments/{id}/replies` → inline expand.
- `useTransition` for pending state.
- Reply form: `parentId` + `replyToUserName` hidden fields; re-fetches replies on success.

---

## Auth UX

**PasswordInput** (`components/password-input.tsx`): bottom-border-only input with inline SVG eye toggle (`type="button"` prevents accidental form submit).

**Field-selective clear on error:** server actions return `{ error, field?: "email" | "password" }`. Client clears only the failed field; valid values persist.

**Form style:** `border-b border-ink` inputs, transparent background, `text-base normal-case tracking-normal` — departs from site-wide uppercase to improve data-entry readability.
