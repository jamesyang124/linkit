"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import type { FeedItem } from "@/src/feed/view-model";
import type { ProviderSummary } from "@/src/domain/linkit";

type ProviderGroup = { providerName: string; count: number };

type GalleryPageResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type ExpandedState = {
  item: FeedItem;
  cardRect: DOMRect;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Scroll so that `sectionId` is at the top of the viewport, then keep
 * correcting for up to `watchMs` ms as lazy images above the section load
 * and change the page height.
 *
 * Root cause: `scrollIntoView` fires once after React commits new items,
 * but lazy images in preceding sections haven't loaded yet (height = 0).
 * After the scroll those images load → preceding sections grow → the target
 * section shifts down.  A ResizeObserver on `.infinite-stage` catches every
 * height change and instantly re-aligns the target within the watch window.
 *
 * `smooth` — pass false when preceding sections were just fetched; skips the
 * smooth animation so the ResizeObserver's instant corrections don't interrupt
 * an in-progress scroll and cause a visible flicker.
 */
function scrollToSection(sectionId: string, watchMs = 4000, smooth = true) {
  const el = document.getElementById(sectionId);
  if (!el) return;

  el.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "start" });

  const stage = document.querySelector<HTMLElement>(".infinite-stage");
  if (!stage) return;

  const deadline = Date.now() + watchMs;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const obs = new ResizeObserver(() => {
    if (Date.now() > deadline) { obs.disconnect(); return; }
    if (debounce) clearTimeout(debounce);
    // 60 ms debounce: batches simultaneous image-load height changes, then
    // snaps instantly so the section header stays pinned at the top.
    debounce = setTimeout(() => {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }, 60);
  });

  obs.observe(stage);
  setTimeout(() => obs.disconnect(), watchMs);
}

const COLUMN_COUNT = 3;

// Distribute items into N columns using shortest-column (count as height proxy).
// Deterministic: same input order always produces same column assignment,
// so appending new items never moves existing ones.
function distributeColumns(items: FeedItem[]): FeedItem[][] {
  const cols: FeedItem[][] = Array.from({ length: COLUMN_COUNT }, () => []);
  const heights = new Array<number>(COLUMN_COUNT).fill(0);
  for (const item of items) {
    const shortest = heights.indexOf(Math.min(...heights));
    cols[shortest].push(item);
    heights[shortest]++;
  }
  return cols;
}

const GallerySection = memo(function GallerySection({
  provider,
  items,
  totalCount,
  loading,
  savedIds,
  onExpand,
  onSaveToggle
}: {
  provider: string;
  items: FeedItem[];
  totalCount: number;
  loading: boolean;
  savedIds: Set<string>;
  onExpand: (id: string, cardEl: HTMLElement) => void;
  onSaveToggle: (id: string) => void;
}) {
  const columns = useMemo(() => distributeColumns(items), [items]);
  const hasItems = items.length > 0;

  return (
    <section className="gallery-section" id={`section-${slugify(provider)}`}>
      <div className="gallery-section-header">
        <span className="gallery-section-name">{provider}</span>
        <span className="gallery-section-spec">
          {totalCount} {totalCount === 1 ? "link" : "links"}
        </span>
      </div>
      {hasItems ? (
        <div className="gallery-section-grid">
          {columns.map((colItems, colIdx) => (
            <div key={colIdx} className="gallery-column">
              {colItems.map((item) => (
                <GalleryTile
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  providerName={item.providerName}
                  thumbnailUrl={item.thumbnailUrl}
                  clickCount={item.clickCount}
                  commentsCount={item.commentsCount}
                  isSaved={savedIds.has(item.id)}
                  onExpand={onExpand}
                  onSaveToggle={onSaveToggle}
                />
              ))}
            </div>
          ))}
        </div>
      ) : loading ? (
        <p className="gallery-section-loading">Loading…</p>
      ) : null}
    </section>
  );
});

export function GalleryFeed({
  initialItems,
  initialCursor,
  providers
}: {
  initialItems: FeedItem[];
  initialCursor: string | null;
  providers: ProviderSummary[];
}) {
  // Items loaded via infinite scroll beyond the initial server page.
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  const loadedProvidersRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Pending section id to scroll to after preceding-section items are rendered.
  const scrollTargetRef = useRef<string | null>(null);
  // Snapshot of initialItems at mount — used by the open-from-saved effect.
  const initialItemsRef = useRef(initialItems);

  // Open a card when navigated from the saved list (?open=<id>).
  // Reads sessionStorage for the full FeedItem (set by SavedGallery before push),
  // falls back to searching the initial server items.
  // Cleans the URL param so back-navigation is clean.
  useEffect(() => {
    const url = new URL(window.location.href);
    const openId = url.searchParams.get("open");
    if (!openId) return;

    // Strip the param immediately — keep the URL clean.
    url.searchParams.delete("open");
    window.history.replaceState({}, "", url.pathname + (url.search === "?" ? "" : url.search));

    // Centered rect → panel animates from screen centre (scale from tiny square)
    // giving a subtle pop-in instead of FLIP from a now-gone profile card.
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(window.innerHeight / 2);
    const centeredRect = new DOMRect(cx - 2, cy - 2, 4, 4);

    const openItem = (item: FeedItem) => {
      setExpanded({ item, cardRect: centeredRect });
    };

    // Try sessionStorage first (fastest path).
    try {
      const stored = sessionStorage.getItem(`pending-open-${openId}`);
      if (stored) {
        sessionStorage.removeItem(`pending-open-${openId}`);
        openItem(JSON.parse(stored) as FeedItem);
        return;
      }
    } catch {
      // Storage blocked — fall through.
    }

    // Fall back to searching initial server items.
    const found = initialItemsRef.current.find((i) => i.id === openId);
    if (found) openItem(found);
    // If still not found: item lives in a provider not yet loaded.
    // The user can scroll to find it; a future enhancement could fetch by ID.
  }, []); // run once on mount

  // Load saved post IDs for the current user on mount.
  useEffect(() => {
    fetch("/api/saves")
      .then((r) => r.json())
      .then((data: { savedIds: string[] }) => {
        if (Array.isArray(data.savedIds)) {
          setSavedIds(new Set(data.savedIds));
        }
      })
      .catch(() => {});
  }, []);

  // Sync cursor when server sends a fresh initialCursor (new post added).
  useEffect(() => {
    setCursor(initialCursor);
  }, [initialCursor]);

  // Merge server items + scroll extras, deduplicated.
  const items = useMemo(() => {
    const baseIds = new Set(initialItems.map((i) => i.id));
    return [...initialItems, ...extraItems.filter((i) => !baseIds.has(i.id))];
  }, [initialItems, extraItems]);

  // Group loaded items by provider for O(1) section lookup.
  const stageGroups = useMemo(() => {
    const groupMap = new Map<string, FeedItem[]>();
    for (const item of items) {
      const bucket = groupMap.get(item.providerName) ?? [];
      bucket.push(item);
      groupMap.set(item.providerName, bucket);
    }
    return groupMap;
  }, [items]);

  // After preceding sections finish loading, scroll to the pending target.
  // Using an effect ensures React has committed the updated item heights to DOM
  // before we scroll (avoids wrong-position scroll with empty preceding sections).
  useEffect(() => {
    const target = scrollTargetRef.current;
    if (!target) return;
    scrollTargetRef.current = null;
    // Use instant scroll: preceding sections were just fetched, so their images
    // will trigger ResizeObserver corrections — instant avoids the correction
    // interrupting a smooth animation (the flicker source).
    scrollToSection(target, 4000, false);
  }, [items]);

  // Map section DOM id → provider name for fast lookup in the observer callback.
  const sectionIdToProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const { providerName } of providers) {
      map.set(`section-${slugify(providerName)}`, providerName);
    }
    return map;
  }, [providers]);

  // Track which gallery section is currently visible and highlight it in the rail.
  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(".gallery-section");
    if (sections.length === 0) return;

    const scrollRoot = document.getElementById("page-main");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const provider = sectionIdToProvider.get(entry.target.id);
            if (provider) setActiveProvider(provider);
          }
        }
      },
      { root: scrollRoot, rootMargin: "-60px 0px -65% 0px", threshold: 0 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [sectionIdToProvider]);

  const handleExpand = useCallback(
    (id: string, cardEl: HTMLElement) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setExpanded({ item, cardRect: cardEl.getBoundingClientRect() });
    },
    [items]
  );

  const handleClose = useCallback(() => setExpanded(null), []);

  const loadProvider = useCallback((providerName: string): Promise<void> => {
    if (loadedProvidersRef.current.has(providerName)) return Promise.resolve();

    const existing = inFlightRef.current.get(providerName);
    if (existing) return existing;

    const promise = (async () => {
      setLoadingProviders((prev) => new Set([...prev, providerName]));
      try {
        const response = await fetch(
          `/api/gallery?provider=${encodeURIComponent(providerName)}`,
          { headers: { accept: "application/json" } }
        );
        if (!response.ok) return;
        const page = (await response.json()) as GalleryPageResponse;
        setExtraItems((current) => {
          const existingIds = new Set([...initialItems, ...current].map((i) => i.id));
          return [...current, ...page.items.filter((i) => !existingIds.has(i.id))];
        });
        loadedProvidersRef.current = new Set([...loadedProvidersRef.current, providerName]);
      } finally {
        setLoadingProviders((prev) => {
          const next = new Set(prev);
          next.delete(providerName);
          return next;
        });
        inFlightRef.current.delete(providerName);
      }
    })();

    inFlightRef.current.set(providerName, promise);
    return promise;
  }, [initialItems]);

  const handleProviderClick = useCallback(
    async (providerName: string) => {
      const targetIdx = providers.findIndex((p) => p.providerName === providerName);
      const sectionId = `section-${slugify(providerName)}`;

      const precedingLoads: Promise<void>[] = [];
      for (let i = 0; i < targetIdx; i++) {
        const p = providers[i].providerName;
        if (!stageGroups.has(p)) {
          precedingLoads.push(loadProvider(p));
        }
      }

      if (precedingLoads.length > 0) {
        // Load preceding sections first, then scroll.
        await Promise.all(precedingLoads);
        // setExtraItems was called inside loadProvider; React will re-render next.
        // Setting scrollTargetRef here ensures the effect (which runs after commit)
        // picks it up once the preceding-section heights are stable in the DOM.
        scrollTargetRef.current = sectionId;
        // Scroll fires via useEffect([items]) after React commits the new items.
      } else {
        scrollToSection(sectionId);
      }

      if (!stageGroups.has(providerName)) {
        void loadProvider(providerName);
      }
    },
    [providers, stageGroups, loadProvider]
  );

  const handleSaveToggle = useCallback(async (id: string) => {
    const wasSaved = savedIds.has(id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      wasSaved ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      const res = await fetch(`/api/saves/${id}`, { method: wasSaved ? "DELETE" : "POST" });
      if (!res.ok) throw new Error(`save ${res.status}`);
    } catch {
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.add(id) : next.delete(id);
        return next;
      });
    }
  }, [savedIds]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;

    setLoading(true);
    setFailed(false);
    try {
      const response = await fetch(
        `/api/gallery?cursor=${encodeURIComponent(cursor)}`,
        { headers: { accept: "application/json" } }
      );
      if (!response.ok) throw new Error(`Gallery page failed: ${response.status}`);

      const page = (await response.json()) as GalleryPageResponse;
      setExtraItems((current) => {
        const ids = new Set(items.map((i) => i.id));
        return [...current, ...page.items.filter((i) => !ids.has(i.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, items]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor) return;

    const scrollRoot = document.getElementById("page-main");

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore();
      },
      { root: scrollRoot, rootMargin: "100% 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const isEmpty = providers.length === 0;

  return (
    <>
      <aside
        className="catalogue-rail"
        data-testid="catalogue-rail"
        aria-label="Catalogue index"
      >
        <h1 id="catalogue-heading">Catalogue</h1>
        <ol>
          {isEmpty ? (
            <li>
              <a
                href="#section-linkit"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("section-linkit");
                }}
              >
                <span className="rail-name">Linkit</span>
                <span className="rail-type">Share first link</span>
              </a>
            </li>
          ) : (
            providers.map((group) => (
              <li
                key={group.providerName}
                data-active={activeProvider === group.providerName ? "" : undefined}
              >
                <a
                  href={`#section-${slugify(group.providerName)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleProviderClick(group.providerName);
                  }}
                >
                  <span className="rail-name">{group.providerName}</span>
                  <span className="rail-type">
                    {group.count} {group.count === 1 ? "link" : "links"}
                  </span>
                </a>
              </li>
            ))
          )}
        </ol>
      </aside>

      <div className="infinite-stage">
        <p className="catalogue-version">MM26.1</p>

        {isEmpty ? (
          <section className="gallery-section" id="section-linkit">
            <div className="gallery-section-header">
              <span className="gallery-section-name">Linkit</span>
              <span className="gallery-section-spec">No links yet</span>
            </div>
          </section>
        ) : (
          providers.map(({ providerName, count }) => (
            <GallerySection
              key={providerName}
              provider={providerName}
              items={stageGroups.get(providerName) ?? []}
              totalCount={count}
              loading={loadingProviders.has(providerName)}
              savedIds={savedIds}
              onExpand={handleExpand}
              onSaveToggle={handleSaveToggle}
            />
          ))
        )}

        <div
          ref={sentinelRef}
          className="gallery-load-sentinel"
          data-testid="gallery-load-sentinel"
        >
          {failed && (
            <button
              type="button"
              className="gallery-load-button"
              onClick={() => void loadMore()}
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <ExpandedCard
          item={expanded.item}
          cardRect={expanded.cardRect}
          onClose={handleClose}
        />
      )}
    </>
  );
}
