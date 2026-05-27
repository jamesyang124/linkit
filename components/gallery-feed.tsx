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

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/**
 * Instant scroll to section — direct scrollTop assignment bypasses
 * CSS scroll-behavior: smooth so there's no fighting with ResizeObserver
 * corrections. No animation: user lands at the section immediately.
 */
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
  // Pending section to jump to after preceding providers load
  const scrollTargetRef = useRef<string | null>(null);

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

  // After items update, jump to pending scroll target (fired after preceding providers load)
  useEffect(() => {
    const target = scrollTargetRef.current;
    if (!target) return;
    scrollTargetRef.current = null;
    jumpToSection(target);
  }, [items]);

  // Map section id → provider name for IntersectionObserver
  const sectionIdToProvider = useMemo(() => {
    const map = new Map<string, string>();
    for (const { providerName } of providers) {
      map.set(`section-${slugify(providerName)}`, providerName);
    }
    return map;
  }, [providers]);

  // Track visible section → highlight in sidebar
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

  // Lazy-load provider content as sections scroll into view
  useEffect(() => {
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
  }, [providers, loadProvider]);

  // Sidebar auto-scrolls to keep active item visible
  useEffect(() => {
    if (!activeProvider || !railListRef.current) return;
    const idx = providers.findIndex((p) => p.providerName === activeProvider);
    if (idx < 0) return;
    const li = railListRef.current.querySelectorAll("li")[idx];
    if (li) li.scrollIntoView({ block: "nearest" });
  }, [activeProvider, providers]);

  const handleProviderClick = useCallback(
    async (providerName: string) => {
      window.dispatchEvent(new Event("provider-switch"));
      const targetIdx = providers.findIndex((p) => p.providerName === providerName);
      const sectionId = `section-${slugify(providerName)}`;

      // Load preceding sections first if they haven't been loaded
      const precedingLoads: Promise<void>[] = [];
      for (let i = 0; i < targetIdx; i++) {
        const p = providers[i].providerName;
        if (!stageGroups.has(p)) {
          precedingLoads.push(loadProvider(p));
        }
      }

      if (precedingLoads.length > 0) {
        // Store jump target; the items-change effect will fire it after commit
        scrollTargetRef.current = sectionId;
        await Promise.all(precedingLoads);
        // Effect fires after React commits the new items
      } else {
        jumpToSection(sectionId);
      }

      if (!stageGroups.has(providerName)) {
        void loadProvider(providerName);
      }
    },
    [providers, stageGroups, loadProvider]
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
            providers.map((group) => (
              <li
                key={group.providerName}
                data-active={
                  activeProvider === group.providerName ? "" : undefined
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

      <div className="infinite-stage">
        <p className="catalogue-version">MM26.1</p>

        {isEmpty ? (
          <section
            className="gallery-section"
            id="section-linkit"
          >
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
