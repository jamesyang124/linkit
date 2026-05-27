"use client";

import { useState, useCallback, useMemo } from "react";

import { GalleryTile } from "@/components/gallery-tile";
import { ExpandedCard } from "@/components/expanded-card";
import type { FeedItem } from "@/src/feed/view-model";

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

export function SavedGallery({ initialItems }: { initialItems: FeedItem[] }) {
  const [items, setItems] = useState<FeedItem[]>(initialItems);
  const [expanded, setExpanded] = useState<ExpandedState | null>(null);

  const columns = useMemo(() => distributeColumns(items), [items]);

  const handleExpand = useCallback(
    (id: string, cardEl: HTMLElement) => {
      const item = items.find((i) => i.id === id);
      if (!item) return;
      setExpanded({ item, cardRect: cardEl.getBoundingClientRect() });
    },
    [items]
  );

  const handleClose = useCallback(() => setExpanded(null), []);

  const handleUnsave = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await fetch(`/api/saves/${id}`, { method: "DELETE" });
    } catch {
      // revert on error
      setItems((prev) => {
        if (prev.find((i) => i.id === id)) return prev;
        const restored = initialItems.find((i) => i.id === id);
        return restored ? [...prev, restored] : prev;
      });
    }
  }, [initialItems]);

  if (items.length === 0) {
    return (
      <p className="saved-gallery-empty">No saved links yet.</p>
    );
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
