"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import type { FeedItem } from "@/src/feed/view-model";

type GalleryPageResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type ExpandedState = {
  item: FeedItem;
  cardRect: DOMRect;
};

type CatalogueGroup = {
  providerName: string;
  count: number;
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
  onExpand
}: {
  provider: string;
  items: FeedItem[];
  totalCount: number;
  onExpand: (id: string, cardEl: HTMLElement) => void;
}) {
  const columns = useMemo(() => distributeColumns(items), [items]);

  return (
    <section className="gallery-section" id={`section-${slugify(provider)}`}>
      <div className="gallery-section-header">
        <span className="gallery-section-name">{provider}</span>
        <span className="gallery-section-spec">
          {totalCount} {totalCount === 1 ? "link" : "links"}
        </span>
      </div>
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
                onExpand={onExpand}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
});

export function GalleryFeed({
  initialItems,
  initialCatalogueItems,
  initialCursor
}: {
  initialItems: FeedItem[];
  initialCatalogueItems: FeedItem[];
  initialCursor: string | null;
}) {
  // Items loaded via infinite scroll beyond the initial server page.
  // Kept separate so when the server re-renders (after a new post + revalidatePath),
  // the fresh initialItems prop is reflected immediately without resetting scroll state.
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Sync cursor when server sends a fresh initialCursor (new post added).
  useEffect(() => {
    setCursor(initialCursor);
  }, [initialCursor]);

  // Merge server items + scroll extras, deduplicated.
  const items = useMemo(() => {
    const baseIds = new Set(initialItems.map((i) => i.id));
    return [...initialItems, ...extraItems.filter((i) => !baseIds.has(i.id))];
  }, [initialItems, extraItems]);

  const stageGroups = useMemo(() => {
    const groupMap = new Map<string, FeedItem[]>();
    for (const item of items) {
      const bucket = groupMap.get(item.providerName) ?? [];
      bucket.push(item);
      groupMap.set(item.providerName, bucket);
    }
    return [...groupMap.entries()];
  }, [items]);

  // Map section DOM id → provider name for fast lookup in the observer callback.
  const sectionIdToProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const [provider] of stageGroups) {
      map.set(`section-${slugify(provider)}`, provider);
    }
    return map;
  }, [stageGroups]);

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

  const catalogueGroups = useMemo(() => {
    const groupMap = new Map<string, CatalogueGroup>();
    for (const item of initialCatalogueItems) {
      const group = groupMap.get(item.providerName) ?? {
        providerName: item.providerName,
        count: 0
      };
      group.count += 1;
      groupMap.set(item.providerName, group);
    }
    return [...groupMap.values()].sort((a, b) =>
      a.providerName.localeCompare(b.providerName)
    );
  }, [initialCatalogueItems]);

  const catalogueTotalsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const group of catalogueGroups) {
      map.set(group.providerName, group.count);
    }
    return map;
  }, [catalogueGroups]);

  const handleExpand = useCallback(
    (id: string, cardEl: HTMLElement) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setExpanded({ item, cardRect: cardEl.getBoundingClientRect() });
    },
    [items]
  );

  const handleClose = useCallback(() => setExpanded(null), []);

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
  }, [cursor, loading]);

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

  const isEmpty = items.length === 0;
  const isCatalogueEmpty = catalogueGroups.length === 0;

  return (
    <>
      <aside
        className="catalogue-rail"
        data-testid="catalogue-rail"
        aria-label="Catalogue index"
      >
        <h1 id="catalogue-heading">Catalogue</h1>
        <ol>
          {isCatalogueEmpty ? (
            <li>
              <a
                href="#section-linkit"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .getElementById("section-linkit")
                    ?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <span className="rail-name">Linkit</span>
                <span className="rail-type">Share first link</span>
              </a>
            </li>
          ) : (
            catalogueGroups.map((group) => (
              <li
                key={group.providerName}
                data-active={activeProvider === group.providerName ? "" : undefined}
              >
                <a
                  href={`#section-${slugify(group.providerName)}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(`section-${slugify(group.providerName)}`)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          stageGroups.map(([provider, groupItems]) => (
            <GallerySection
              key={provider}
              provider={provider}
              items={groupItems}
              totalCount={catalogueTotalsMap.get(provider) ?? groupItems.length}
              onExpand={handleExpand}
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
