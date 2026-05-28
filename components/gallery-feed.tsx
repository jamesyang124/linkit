"use client";

import { useCallback, useEffect, useMemo, useRef, useState, memo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import { PRESET_TAGS } from "@/components/submit-form";
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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function jumpToSection(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const scrollContainer = document.getElementById("page-main");
  if (scrollContainer) {
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const elTop = el.getBoundingClientRect().top;
    const marginTop = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    scrollContainer.scrollTop += elTop - containerTop - marginTop;
  } else {
    el.scrollIntoView({ behavior: "instant", block: "start" });
  }
}

const COLUMN_COUNT = 3;
const FILTERED_PAGE_SIZE = 24;

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
    <section
      className="gallery-section"
      id={`section-${slugify(provider)}`}
      data-provider={provider}
    >
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

// Flat filtered view with client-side pagination
function FilteredGallery({
  items,
  savedIds,
  onExpand,
  onSaveToggle
}: {
  items: FeedItem[];
  savedIds: Set<string>;
  onExpand: (id: string, cardEl: HTMLElement) => void;
  onSaveToggle: (id: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(FILTERED_PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination when items change (different filter)
  useEffect(() => {
    setVisibleCount(FILTERED_PAGE_SIZE);
  }, [items]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const columns = useMemo(() => distributeColumns(visibleItems), [visibleItems]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;
    const scrollRoot = document.getElementById("page-main");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + FILTERED_PAGE_SIZE, items.length));
        }
      },
      { root: scrollRoot, rootMargin: "400px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  if (items.length === 0) {
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
      {visibleCount < items.length && (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      )}
    </>
  );
}

export function GalleryFeed({
  initialItems,
  providers
}: {
  initialItems: FeedItem[];
  providers: ProviderSummary[];
}) {
  const [extraItems, setExtraItems] = useState<FeedItem[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState<Set<string>>(new Set());
  const loadedProvidersRef = useRef<Set<string>>(new Set());
  const inFlightRef = useRef<Map<string, Promise<void>>>(new Map());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const railListRef = useRef<HTMLOListElement>(null);
  const initialItemsRef = useRef(initialItems);
  const scrollTargetRef = useRef<string | null>(null);

  // Tag + provider filter state
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [filterProvider, setFilterProvider] = useState<string | null>(null);

  const isFiltered = activeTags.length > 0;

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

  // Filtered items for tag view — OR on tags, AND with provider if set
  const filteredItems = useMemo(() => {
    if (!isFiltered) return items;
    return items.filter((item) => {
      const tagMatch = item.tags.some((t) => activeTags.includes(t));
      if (!tagMatch) return false;
      if (filterProvider && item.providerName !== filterProvider) return false;
      return true;
    });
  }, [items, isFiltered, activeTags, filterProvider]);

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

  // Jump to pending section after items update
  useEffect(() => {
    const target = scrollTargetRef.current;
    if (!target) return;
    scrollTargetRef.current = null;
    jumpToSection(target);
  }, [items]);

  // Section id → provider name map
  const sectionIdToProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const { providerName } of providers) {
      map.set(`section-${slugify(providerName)}`, providerName);
    }
    return map;
  }, [providers]);

  // Track visible section → sidebar highlight (only in non-filtered view)
  useEffect(() => {
    if (isFiltered) return;
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
  }, [sectionIdToProvider, isFiltered]);

  // Lazy-load providers as sections become visible
  useEffect(() => {
    if (isFiltered) return;
    const scrollRoot = document.getElementById("page-main");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const provider = entry.target.getAttribute("data-provider");
            if (provider) void loadProvider(provider);
          }
        }
      },
      { root: scrollRoot, rootMargin: "60% 0px" }
    );
    const sections = document.querySelectorAll<HTMLElement>(
      ".gallery-section[data-provider]"
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [providers, loadProvider, isFiltered]);

  // Sidebar auto-scroll to active item
  useEffect(() => {
    if (!activeProvider || !railListRef.current) return;
    const idx = providers.findIndex((p) => p.providerName === activeProvider);
    if (idx < 0) return;
    const li = railListRef.current.querySelectorAll("li")[idx];
    if (li) li.scrollIntoView({ block: "nearest" });
  }, [activeProvider, providers]);

  // Prefetch adjacent sections
  useEffect(() => {
    if (!activeProvider || isFiltered) return;
    const idx = providers.findIndex((p) => p.providerName === activeProvider);
    if (idx < 0) return;
    if (idx > 0) void loadProvider(providers[idx - 1].providerName);
    if (idx < providers.length - 1) void loadProvider(providers[idx + 1].providerName);
  }, [activeProvider, providers, loadProvider, isFiltered]);

  const handleProviderClick = useCallback(
    async (providerName: string) => {
      if (isFiltered) {
        // In filter mode: toggle provider filter (click same → clear, click other → set)
        setFilterProvider((prev) => (prev === providerName ? null : providerName));
        return;
      }

      window.dispatchEvent(new Event("provider-switch"));
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
        scrollTargetRef.current = sectionId;
        await Promise.all(precedingLoads);
      } else {
        jumpToSection(sectionId);
      }

      if (!stageGroups.has(providerName)) {
        void loadProvider(providerName);
      }
    },
    [providers, stageGroups, loadProvider, isFiltered]
  );

  const handleTagToggle = useCallback((tag: string) => {
    setActiveTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      if (next.length === 0) setFilterProvider(null);
      return next;
    });
  }, []);

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
      {/* Left sidebar — Sources */}
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
            providers.map((group) => (
              <li
                key={group.providerName}
                data-active={
                  isFiltered
                    ? filterProvider === group.providerName ? "" : undefined
                    : activeProvider === group.providerName ? "" : undefined
                }
              >
                <button
                  type="button"
                  className="rail-item-btn"
                  onClick={() => void handleProviderClick(group.providerName)}
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
        ) : isFiltered ? (
          <div className="gallery-stage-content">
            <div className="gallery-filter-header">
              <span className="gallery-filter-label">
                {filteredItems.length} {filteredItems.length === 1 ? "link" : "links"}
                {filterProvider ? ` · ${filterProvider}` : ""}
              </span>
            </div>
            <FilteredGallery
              items={filteredItems}
              savedIds={savedIds}
              onExpand={handleExpand}
              onSaveToggle={handleSaveToggle}
            />
          </div>
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
        {activeTags.length > 0 && (
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
