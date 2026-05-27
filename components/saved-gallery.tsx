"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { GalleryTile } from "@/components/gallery-tile";
import type { FeedItem } from "@/src/feed/view-model";

const COLUMN_COUNT = 3;
const PAGE_SIZE = 12;

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

export function SavedGallery({ initialItems }: { initialItems: FeedItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const columns = useMemo(() => distributeColumns(visibleItems), [visibleItems]);

  // Batch reveal: load PAGE_SIZE more tiles each time sentinel scrolls into view.
  // Root is the right column scroll container (.profile-layout-saved).
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= items.length) return;

    const scrollRoot = sentinel.closest<HTMLElement>(".profile-layout-saved") ?? null;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, items.length));
        }
      },
      { root: scrollRoot, rootMargin: "200px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [items.length, visibleCount]);

  // Card click → store item in sessionStorage, navigate to landing with ?open=<id>.
  // GalleryFeed reads the param on mount and opens the expanded card.
  const handleExpand = useCallback(
    (id: string, _cardEl: HTMLElement) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      try {
        sessionStorage.setItem(`pending-open-${id}`, JSON.stringify(item));
      } catch {
        // Storage blocked — landing page falls back to searching loaded items.
      }
      router.push(`/?open=${encodeURIComponent(id)}`);
    },
    [items, router]
  );

  const handleUnsave = useCallback(
    async (id: string) => {
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await fetch(`/api/saves/${id}`, { method: "DELETE" });
      } catch {
        // Revert on error.
        setItems((prev) => {
          if (prev.find((i) => i.id === id)) return prev;
          const restored = initialItems.find((i) => i.id === id);
          return restored ? [...prev, restored] : prev;
        });
      }
    },
    [initialItems]
  );

  if (items.length === 0) {
    return <p className="saved-gallery-empty">No saved links yet.</p>;
  }

  return (
    <>
      <div className="saved-gallery-grid">
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
                isSaved={true}
                onExpand={handleExpand}
                onSaveToggle={handleUnsave}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Sentinel triggers next batch when it scrolls near the viewport */}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="saved-gallery-sentinel" aria-hidden="true" />
      )}
    </>
  );
}
