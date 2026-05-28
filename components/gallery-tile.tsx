"use client";

import { useRef } from "react";

import { GalleryThumb } from "@/components/gallery-thumb";

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function GalleryTile({
  id,
  title,
  providerName,
  thumbnailUrl,
  clickCount,
  commentsCount,
  isSaved,
  onExpand,
  onSaveToggle
}: {
  id: string;
  title: string;
  providerName: string;
  thumbnailUrl: string | null;
  clickCount: number;
  commentsCount: number;
  isSaved?: boolean;
  onExpand: (id: string, cardEl: HTMLElement) => void;
  onSaveToggle?: (id: string) => void;
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
          <span className="gallery-tile-provider">{providerName}</span>
          <span className="gallery-tile-counts">
            <span>{clickCount} {clickCount === 1 ? "visit" : "visits"}</span>
            <span>{commentsCount} {commentsCount === 1 ? "comment" : "comments"}</span>
          </span>
        </span>
      </button>
      {onSaveToggle && (
        <button
          className={`gallery-save-btn${isSaved ? " is-saved" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            onSaveToggle(id);
          }}
          aria-label={isSaved ? "Unsave" : "Save"}
          aria-pressed={isSaved}
        >
          <BookmarkIcon filled={!!isSaved} />
        </button>
      )}
    </article>
  );
}
