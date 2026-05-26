"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { GalleryThumb } from "@/components/gallery-thumb";
import { CommentSection } from "@/components/comment-section";
import type { FeedItem } from "@/src/feed/view-model";

interface ExpandedCardProps {
  item: FeedItem;
  cardRect: DOMRect;
  onClose: () => void;
}

const PANEL_WIDTH = 820;
const MIN_PANEL_HEIGHT = 520;
const PANEL_MARGIN = 24;

export function ExpandedCard({ item, cardRect, onClose }: ExpandedCardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const didAnimateRef = useRef(false);
  const thumbnailUrl = item.thumbnailUrl;
  const [viewport, setViewport] = useState(() => ({
    width: typeof window === "undefined" ? PANEL_WIDTH + 32 : window.innerWidth,
    height: typeof window === "undefined" ? 760 : window.innerHeight,
    navBottom: 0
  }));
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    function measureViewport() {
      const nav = document.querySelector("[data-testid='site-nav']");
      const navBottom = nav?.getBoundingClientRect().bottom ?? 0;
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        navBottom
      });
    }

    measureViewport();
    window.addEventListener("resize", measureViewport);
    return () => window.removeEventListener("resize", measureViewport);
  }, []);

  useEffect(() => {
    if (!thumbnailUrl) {
      setImageAspectRatio(null);
      return;
    }

    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || image.naturalWidth === 0 || image.naturalHeight === 0) {
        return;
      }
      setImageAspectRatio(image.naturalWidth / image.naturalHeight);
    };
    image.onerror = () => {
      if (!cancelled) {
        setImageAspectRatio(null);
      }
    };
    image.src = thumbnailUrl;

    return () => {
      cancelled = true;
    };
  }, [thumbnailUrl]);

  const { panelWidth, panelHeight, panelLeft, panelTop } = useMemo(() => {
    const availableHeight = Math.max(360, viewport.height - viewport.navBottom);
    const maxPanelHeight = Math.max(320, availableHeight - PANEL_MARGIN * 2);
    const width = Math.min(PANEL_WIDTH, viewport.width - 32);
    const imageColumnWidth = viewport.width <= 767 ? width : width / 2;
    const imageBasedHeight = imageAspectRatio
      ? imageColumnWidth / imageAspectRatio
      : maxPanelHeight * 0.86;
    const height = Math.round(
      Math.min(
        Math.max(imageBasedHeight, Math.min(MIN_PANEL_HEIGHT, maxPanelHeight)),
        maxPanelHeight
      )
    );

    return {
      panelWidth: width,
      panelHeight: height,
      panelLeft: Math.round((viewport.width - width) / 2),
      panelTop: Math.round(
        viewport.navBottom + Math.max(PANEL_MARGIN, (availableHeight - height) / 2)
      )
    };
  }, [imageAspectRatio, viewport]);

  // FLIP: start at card rect, animate to centered panel
  useEffect(() => {
    const el = panelRef.current;
    if (!el || didAnimateRef.current) return;
    didAnimateRef.current = true;

    const scaleX = cardRect.width / panelWidth;
    const scaleY = cardRect.height / panelHeight;
    const dx = cardRect.left - panelLeft;
    const dy = cardRect.top - panelTop;

    el.style.transform = `translate(${dx}px, ${dy}px) scale(${scaleX}, ${scaleY})`;
    el.style.opacity = "0";
    el.style.transition = "none";

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition =
          "transform 340ms cubic-bezier(0.16, 1, 0.3, 1), opacity 180ms ease";
        el.style.transform = "none";
        el.style.opacity = "1";
      });
    });
  }, [cardRect, panelHeight, panelLeft, panelTop, panelWidth]);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const modal = (
    <>
      <div
        className="card-expand-backdrop"
        style={{
          background:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(12, 10, 8, 0.34)), rgba(12, 10, 8, 0.32)",
          backdropFilter: "blur(18px) saturate(1.35)",
          WebkitBackdropFilter: "blur(18px) saturate(1.35)"
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="card-expand-panel"
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          left: panelLeft,
          top: panelTop,
          width: panelWidth,
          height: panelHeight,
          transformOrigin: "top left"
        }}
      >
        <div className="card-expand-inner">
          {/* Image column */}
          <div className="card-expand-image">
            <GalleryThumb
              thumbnailUrl={thumbnailUrl}
              providerName={item.providerName}
            />
          </div>

          {/* Detail column */}
          <div className="card-expand-detail">
            <div className="card-expand-header">
              <div className="card-expand-actions">
                <button
                  className="card-expand-close"
                  onClick={onClose}
                  aria-label="Close"
                >
                  ×
                </button>
                <a
                  href={item.href}
                  className="visit-button"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit →
                </a>
              </div>
              <p className="profile-source">{item.providerName}</p>
              <h2 className="card-expand-title">{item.title}</h2>
              <dl className="card-expand-meta">
                <div>
                  <dt>Comments</dt>
                  <dd>{item.commentsCount}</dd>
                </div>
                <div>
                  <dt>Visits</dt>
                  <dd>{item.clickCount}</dd>
                </div>
              </dl>
            </div>

            <div className="card-expand-comments">
              <CommentSection postId={item.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modal, document.body);
}
