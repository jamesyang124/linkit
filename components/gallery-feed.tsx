"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import type { FeedItem } from "@/src/feed/view-model";
import type { ProviderSummary } from "@/src/domain/linkit";

type GalleryPageResponse = {
  items: FeedItem[];
  nextCursor: string | null;
};

type ExpandedState = {
  item: FeedItem;
  cardRect: DOMRect;
};

const COLUMN_COUNT = 3;

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
    <section className="gallery-section">
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
  providers
}: {
  initialItems: FeedItem[];
  providers: ProviderSummary[];
}) {
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [transitionKey, setTransitionKey] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  const loadedProvidersRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const railListRef = useRef<HTMLOListElement>(null);
  const initialItemsRef = useRef(initialItems);

  const selectedProvider = providers[selectedIdx]?.providerName ?? null;
  const prevEntry = selectedIdx > 0 ? providers[selectedIdx - 1] : null;
  const nextEntry =
    selectedIdx < providers.length - 1 ? providers[selectedIdx + 1] : null;

  // Open card from saved list (?open=<id>)
  useEffect(() => {
    const url = new URL(window.location.href);
    const openId = url.searchParams.get("open");
    if (!openId) return;
    url.searchParams.delete("open");
    window.history.replaceState(
      {},
      "",
      url.pathname + (url.search === "?" ? "" : url.search)
    );
    const cx = Math.round(window.innerWidth / 2);
    const cy = Math.round(window.innerHeight / 2);
    const centeredRect = new DOMRect(cx - 2, cy - 2, 4, 4);
    const openItem = (item: FeedItem) =>
      setExpanded({ item, cardRect: centeredRect });
    try {
      const stored = sessionStorage.getItem(`pending-open-${openId}`);
      if (stored) {
        sessionStorage.removeItem(`pending-open-${openId}`);
        openItem(JSON.parse(stored) as FeedItem);
        return;
      }
    } catch {
      // storage blocked
    }
    const found = initialItemsRef.current.find((i) => i.id === openId);
    if (found) openItem(found);
  }, []);

  // Load saved IDs on mount
  useEffect(() => {
    fetch("/api/saves")
      .then((r) => r.json())
      .then((data: { savedIds: string[] }) => {
        if (Array.isArray(data.savedIds)) setSavedIds(new Set(data.savedIds));
      })
      .catch(() => {});
  }, []);

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
    return groupMap;
  }, [items]);

  const loadProvider = useCallback(
    (providerName: string): Promise<void> => {
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
            const existingIds = new Set(
              [...initialItems, ...current].map((i) => i.id)
            );
            return [
              ...current,
              ...page.items.filter((i) => !existingIds.has(i.id))
            ];
          });
          loadedProvidersRef.current = new Set([
            ...loadedProvidersRef.current,
            providerName
          ]);
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
    },
    [initialItems]
  );

  // Load selected + adjacent providers whenever selection changes
  useEffect(() => {
    const sel = providers[selectedIdx]?.providerName;
    const prev = providers[selectedIdx - 1]?.providerName;
    const next = providers[selectedIdx + 1]?.providerName;
    if (sel) void loadProvider(sel);
    if (prev) void loadProvider(prev);
    if (next) void loadProvider(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  // Scroll sidebar rail to keep active item visible
  useEffect(() => {
    if (!railListRef.current) return;
    const li = railListRef.current.querySelectorAll("li")[selectedIdx];
    if (li) li.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const switchProvider = useCallback(
    (newIdx: number) => {
      if (
        newIdx === selectedIdx ||
        newIdx < 0 ||
        newIdx >= providers.length
      )
        return;
      const name = providers[newIdx]?.providerName;
      if (name) void loadProvider(name);

      setIsTransitioning(true);
      setTimeout(() => {
        setSelectedIdx(newIdx);
        setTransitionKey((k) => k + 1);
        setIsTransitioning(false);
        const pageMain = document.getElementById("page-main");
        if (pageMain) pageMain.scrollTop = 0;
      }, 180);
    },
    [selectedIdx, providers, loadProvider]
  );

  const handleProviderClick = useCallback(
    (providerName: string) => {
      const idx = providers.findIndex((p) => p.providerName === providerName);
      if (idx !== -1) switchProvider(idx);
    },
    [providers, switchProvider]
  );

  const handleExpand = useCallback(
    (id: string, cardEl: HTMLElement) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setExpanded({ item, cardRect: cardEl.getBoundingClientRect() });
    },
    [items]
  );

  const handleClose = useCallback(() => setExpanded(null), []);

  const handleSaveToggle = useCallback(
    async (id: string) => {
      const wasSaved = savedIds.has(id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        wasSaved ? next.delete(id) : next.add(id);
        return next;
      });
      try {
        const res = await fetch(`/api/saves/${id}`, {
          method: wasSaved ? "DELETE" : "POST"
        });
        if (!res.ok) throw new Error(`save ${res.status}`);
      } catch {
        setSavedIds((prev) => {
          const next = new Set(prev);
          wasSaved ? next.add(id) : next.delete(id);
          return next;
        });
      }
    },
    [savedIds]
  );

  const isEmpty = providers.length === 0;

  return (
    <>
      <aside
        className="catalogue-rail"
        data-testid="catalogue-rail"
        aria-label="Sources index"
      >
        <h1 id="sources-heading">Sources</h1>
        <ol ref={railListRef}>
          {isEmpty ? (
            <li>
              <button type="button" className="rail-item-btn">
                <span className="rail-name">Linkit</span>
                <span className="rail-type">Share first link</span>
              </button>
            </li>
          ) : (
            providers.map((group, idx) => (
              <li
                key={group.providerName}
                data-active={selectedIdx === idx ? "" : undefined}
              >
                <button
                  type="button"
                  className="rail-item-btn"
                  onClick={() => handleProviderClick(group.providerName)}
                >
                  <span className="rail-name">{group.providerName}</span>
                  <span className="rail-type">
                    {group.count} {group.count === 1 ? "link" : "links"}
                  </span>
                </button>
              </li>
            ))
          )}
        </ol>
      </aside>

      <div className="infinite-stage">
        <p className="catalogue-version">MM26.1</p>

        {!isEmpty && selectedProvider && (
          <nav className="section-breadcrumb" aria-label="Provider navigation">
            {prevEntry ? (
              <button
                type="button"
                className="section-nav-btn section-nav-btn--prev"
                onClick={() => switchProvider(selectedIdx - 1)}
                aria-label={`Go to ${prevEntry.providerName}`}
              >
                ← {prevEntry.providerName}
              </button>
            ) : (
              <span className="section-nav-placeholder" />
            )}
            <span className="section-nav-current">{selectedProvider}</span>
            {nextEntry ? (
              <button
                type="button"
                className="section-nav-btn section-nav-btn--next"
                onClick={() => switchProvider(selectedIdx + 1)}
                aria-label={`Go to ${nextEntry.providerName}`}
              >
                {nextEntry.providerName} →
              </button>
            ) : (
              <span className="section-nav-placeholder" />
            )}
          </nav>
        )}

        {isEmpty ? (
          <section className="gallery-section">
            <div className="gallery-section-header">
              <span className="gallery-section-name">Linkit</span>
              <span className="gallery-section-spec">No links yet</span>
            </div>
          </section>
        ) : (
          <div
            key={transitionKey}
            className={`gallery-stage-content${isTransitioning ? " gallery-stage-content--out" : ""}`}
          >
            {selectedProvider && (
              <GallerySection
                provider={selectedProvider}
                items={stageGroups.get(selectedProvider) ?? []}
                totalCount={
                  providers.find((p) => p.providerName === selectedProvider)
                    ?.count ?? 0
                }
                loading={loadingProviders.has(selectedProvider)}
                savedIds={savedIds}
                onExpand={handleExpand}
                onSaveToggle={handleSaveToggle}
              />
            )}
          </div>
        )}
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
