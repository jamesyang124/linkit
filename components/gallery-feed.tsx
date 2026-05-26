"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import type { FeedItem } from "@/src/feed/view-model";

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
  onExpand
}: {
  provider: string;
  items: FeedItem[];
  totalCount: number;
  loading: boolean;
  onExpand: (id: string, cardEl: HTMLElement) => void;
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
                  onExpand={onExpand}
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
  allProviders
}: {
  initialItems: FeedItem[];
  initialCursor: string | null;
  allProviders: ProviderGroup[];
}) {
  // Items loaded via infinite scroll beyond the initial server page.
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  // Ref-based guard: prevents re-fetching a provider already loaded via provider API.
  const loadedProvidersRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
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

  // Map section DOM id → provider name for fast lookup in the observer callback.
  const sectionIdToProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const { providerName } of allProviders) {
      map.set(`section-${slugify(providerName)}`, providerName);
    }
    return map;
  }, [allProviders]);

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

  // Fetch all items for a provider on demand. Returns a Promise so callers can await.
  // Inflight dedup: concurrent calls for the same provider share one fetch.
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

  // On click: load all preceding unloaded sections first, then scroll to target.
  // Preceding loads run in parallel; scroll fires only after they resolve so the
  // user lands on a fully-rendered target rather than skipping past empty sections.
  const handleProviderClick = useCallback(
    async (providerName: string) => {
      const targetIdx = allProviders.findIndex((p) => p.providerName === providerName);

      const precedingLoads: Promise<void>[] = [];
      for (let i = 0; i < targetIdx; i++) {
        const p = allProviders[i].providerName;
        if (!stageGroups.has(p)) {
          precedingLoads.push(loadProvider(p));
        }
      }

      if (precedingLoads.length > 0) {
        await Promise.all(precedingLoads);
      }

      document
        .getElementById(`section-${slugify(providerName)}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });

      if (!stageGroups.has(providerName)) {
        void loadProvider(providerName);
      }
    },
    [allProviders, stageGroups, loadProvider]
  );

  // Keyset-paginated infinite scroll: load next page when sentinel enters viewport.
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

  const isEmpty = allProviders.length === 0;

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
            allProviders.map((group) => (
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
          allProviders.map(({ providerName, count }) => (
            <GallerySection
              key={providerName}
              provider={providerName}
              items={stageGroups.get(providerName) ?? []}
              totalCount={count}
              loading={loadingProviders.has(providerName)}
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
