"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import { SubmitForm, PRESET_TAGS } from "@/components/submit-form";
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

function FlatGallery({
  items,
  savedIds,
  onExpand,
  onSaveToggle,
  onLoadMore,
  loadingMore,
  providerLoading,
}: {
  items: FeedItem[];
  savedIds: Set<string>;
  onExpand: (id: string, cardEl: HTMLElement) => void;
  onSaveToggle: (id: string) => void;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  providerLoading?: boolean;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const columns = useMemo(() => distributeColumns(items), [items]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !onLoadMore) return;
    const scrollRoot = document.getElementById("page-main");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) onLoadMore();
      },
      { root: scrollRoot, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore]);

  if (items.length === 0) {
    if (providerLoading) {
      return <p className="gallery-section-loading">Loading…</p>;
    }
    if (loadingMore || onLoadMore) {
      return (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      );
    }
    return <p className="gallery-filter-empty">No links match this filter.</p>;
  }

  return (
    <>
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
      {onLoadMore && (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      )}
    </>
  );
}

export function GalleryFeed({
  initialItems,
  initialNextCursor,
  providers,
}: {
  initialItems: FeedItem[];
  initialNextCursor: string | null;
  providers: ProviderSummary[];
}) {
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [showSubmit, setShowSubmit] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);

  const loadedProvidersRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const initialItemsRef = useRef(initialItems);

  const isFiltered = activeTags.length > 0 || filterProvider !== null;

  // Open submit modal from nav Share link
  useEffect(() => {
    const handler = () => setShowSubmit(true);
    window.addEventListener("show-submit-modal", handler);
    return () => window.removeEventListener("show-submit-modal", handler);
  }, []);

  useEffect(() => {
    if (!showSubmit) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSubmit(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showSubmit]);

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

  const allItems = useMemo(() => {
    const baseIds = new Set(initialItems.map((i) => i.id));
    return [...initialItems, ...extraItems.filter((i) => !baseIds.has(i.id))];
  }, [initialItems, extraItems]);

  const displayItems = useMemo(() => {
    if (!isFiltered) return allItems;
    return allItems.filter((item) => {
      if (filterProvider && item.providerName !== filterProvider) return false;
      if (activeTags.length > 0 && !item.tags.some((t) => activeTags.includes(t))) return false;
      return true;
    });
  }, [allItems, isFiltered, filterProvider, activeTags]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/gallery?cursor=${encodeURIComponent(nextCursor)}`);
      if (!res.ok) return;
      const page = (await res.json()) as GalleryPageResponse;
      setExtraItems((prev) => {
        const ids = new Set([...initialItems, ...prev].map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !ids.has(i.id))];
      });
      setNextCursor(page.nextCursor);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, initialItems]);

  const loadProvider = useCallback(
    (providerName: string): Promise<void> => {
      if (loadedProvidersRef.current.has(providerName)) return Promise.resolve();
      const existing = inFlightRef.current.get(providerName);
      if (existing) return existing;

      setLoadingProvider(providerName);
      const promise = (async () => {
        try {
          const res = await fetch(
            `/api/gallery?provider=${encodeURIComponent(providerName)}`
          );
          if (!res.ok) return;
          const page = (await res.json()) as GalleryPageResponse;
          setExtraItems((prev) => {
            const ids = new Set([...initialItems, ...prev].map((i) => i.id));
            return [...prev, ...page.items.filter((i) => !ids.has(i.id))];
          });
          loadedProvidersRef.current = new Set([
            ...loadedProvidersRef.current,
            providerName,
          ]);
        } finally {
          inFlightRef.current.delete(providerName);
          setLoadingProvider((prev) => (prev === providerName ? null : prev));
        }
      })();

      inFlightRef.current.set(providerName, promise);
      return promise;
    },
    [initialItems]
  );

  const handleProviderClick = useCallback(
    (providerName: string) => {
      const next = filterProvider === providerName ? null : providerName;
      setFilterProvider(next);
      if (next) void loadProvider(next);
    },
    [filterProvider, loadProvider]
  );

  const handleTagToggle = useCallback((tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleExpand = useCallback(
    (id: string, cardEl: HTMLElement) => {
      const item = allItems.find((i) => i.id === id);
      if (!item) return;
      setExpanded({ item, cardRect: cardEl.getBoundingClientRect() });
    },
    [allItems]
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
          method: wasSaved ? "DELETE" : "POST",
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

  // Cursor-paginate only when no provider filter active (provider load covers that case)
  const canLoadMore = nextCursor !== null && filterProvider === null && !loadingMore;
  const isProviderLoading = filterProvider !== null && loadingProvider === filterProvider;

  return (
    <>
      {/* Left sidebar — Sources */}
      <aside
        className="catalogue-rail"
        data-testid="catalogue-rail"
        aria-label="Sources index"
      >
        <h1 id="sources-heading">Sources</h1>
        <ol>
          {isEmpty ? (
            <li>
              <button type="button" className="rail-item-btn">
                <span className="rail-name">Linkit</span>
                <span className="rail-type">Share first link</span>
              </button>
            </li>
          ) : (
            providers.map((group) => (
              <li
                key={group.providerName}
                data-active={
                  filterProvider === group.providerName ? "" : undefined
                }
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

      {/* Main gallery stage */}
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
          <div className="gallery-stage-content">
            {isFiltered && !filterProvider && (
              <div className="gallery-filter-header">
                <span className="gallery-filter-label">
                  {displayItems.length}{" "}
                  {displayItems.length === 1 ? "link" : "links"}
                </span>
              </div>
            )}
            <FlatGallery
              items={displayItems}
              savedIds={savedIds}
              onExpand={handleExpand}
              onSaveToggle={handleSaveToggle}
              onLoadMore={canLoadMore ? loadMore : undefined}
              loadingMore={loadingMore}
              providerLoading={isProviderLoading}
            />
          </div>
        )}
      </div>

      {/* Right sidebar — Tags */}
      <aside className="tag-rail" aria-label="Tag filter">
        <h2 className="tag-rail-heading">Filter</h2>
        <div className="tag-rail-list">
          {PRESET_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-rail-btn${activeTags.includes(tag) ? " is-active" : ""}`}
              onClick={() => handleTagToggle(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        {(activeTags.length > 0 || filterProvider !== null) && (
          <button
            type="button"
            className="tag-rail-clear"
            onClick={() => {
              setActiveTags([]);
              setFilterProvider(null);
            }}
          >
            Clear
          </button>
        )}
      </aside>

      {showSubmit &&
        createPortal(
          <>
            <div
              className="card-expand-backdrop"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(12, 10, 8, 0.34)), rgba(12, 10, 8, 0.32)",
                backdropFilter: "blur(18px) saturate(1.35)",
                WebkitBackdropFilter: "blur(18px) saturate(1.35)"
              }}
              onClick={() => setShowSubmit(false)}
            />
            <div className="submit-modal-panel">
              <SubmitForm onSuccess={() => setShowSubmit(false)} />
            </div>
          </>,
          document.body
        )}

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
