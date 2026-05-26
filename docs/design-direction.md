# Linkit Design Direction

## Reference

- Awwwards inspiration: `https://www.awwwards.com/inspiration/info-page-andres-briganti`
- Awwwards inspiration: `https://www.awwwards.com/inspiration/infinite-scroll-andres-briganti`
- Related live reference: `https://www.briganti.works/`
- Work-page reference: `https://www.briganti.works/work`
- Detail-page reference from user: `https://www.pinterest.com/pin/4597753120114557184/`

## Interpretation

Current target is much closer to the supplied references than the earlier editorial feed:

- Landing page is the catalogue/infinite-scroll surface, not `/work`.
- Sparse top navigation with no visible `/work` entry.
- Left catalogue rail, numbered links, topics block, and large faint vertical background type.
- Scattered image-forward tiles arranged in an infinite-canvas rhythm rather than a full-width feed.
- Landing page should not show dense comments, counters, or explanatory product copy.
- Clicked items open a Pinterest-like profile/detail page with large image left, details/comments right, and related placeholders.
- Caddy HTTPS is the default development/browser entrypoint at `https://localhost:8443`.
- Direct Next dev is only for debugging through `npm run dev:web`.

Keep these lower-level style traits:

- Pale canvas, restrained contrast, and fine column/grid lines.
- Strong typographic hierarchy without oversized marketing copy on the landing page.
- Minimal monochrome base with one restrained accent.
- Short metadata blocks such as version, signal, status, and topics.
- Soft entrance/fade transitions that do not block reading or posting links.

## Product Fit

Linkit should remain a usable link-sharing app. The reference style should shape the layout, rhythm, and typography, while the app keeps efficient workflows:

- Public catalogue is the first screen.
- Submit form is available but not dominant during landing.
- Auth, comments, redirect tracking, and feedback banners stay simple and direct.
- Animations must be progressive enhancement and respect reduced-motion.

## Acceptance Notes

- Desktop: first viewport shows sparse nav, catalogue rail, large faint vertical word, and scattered visual tiles inside a constrained width.
- Mobile: catalogue and tiles stack without horizontal overflow.
- `/work` is not the first-class gallery route; `/` is.
- Gallery items link to `/p/[postId]` profile/detail pages.
- Default E2E/dev browser URL is Caddy HTTPS, not direct HTTP Next dev.
- The UI should be verified with Playwright layout checks and screenshots; final user review can still drive pixel-level refinements toward the supplied references.
