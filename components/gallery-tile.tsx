"use client";

import { useRef } from "react";

import { GalleryThumb } from "@/components/gallery-thumb";

export function GalleryTile({
  id,
  title,
  providerName,
  thumbnailUrl,
  clickCount,
  commentsCount,
  onExpand
}: {
  id: string;
  title: string;
  providerName: string;
  thumbnailUrl: string | null;
  clickCount: number;
  commentsCount: number;
  onExpand: (id: string, cardEl: HTMLElement) => void;
}) {
  const articleRef = useRef<HTMLElement>(null);

  return (
    <article
      ref={articleRef}
      className="gallery-tile"
      data-testid="gallery-tile"
    >
      <button
        className="gallery-tile-btn"
        onClick={() => {
          if (articleRef.current) onExpand(id, articleRef.current);
        }}
        aria-label={`Expand ${title}`}
      >
        <GalleryThumb
          thumbnailUrl={thumbnailUrl}
          providerName={providerName}
        />
        <span className="gallery-tile-stats">
          <span>
            {clickCount} {clickCount === 1 ? "visit" : "visits"}
          </span>
          <span>
            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
          </span>
        </span>
      </button>
    </article>
  );
}
