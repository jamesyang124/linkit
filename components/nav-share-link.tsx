"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Scroll `#page-main` to the `#submit` section and keep correcting for up
 * to `watchMs` ms as the gallery lazy-loads items that push `#submit` down.
 *
 * Root cause of the old timeout-based approach: fixed delays (1.2s/3s/5s)
 * are fragile — gallery load time varies.  A ResizeObserver on
 * `.infinite-stage` fires whenever tile heights change (images loading,
 * new items added) and immediately re-aligns to `#submit`, stopping once
 * the page is stable or the watch window expires.
 *
 * All scrolls are instant (no smooth animation) so rapid ResizeObserver
 * corrections don't chain into a smooth-scroll jank loop.  Direct scrollTop
 * assignment is used instead of scrollIntoView({ behavior: "instant" })
 * because CSS `scroll-behavior: smooth` on `#page-main` can override the JS
 * hint in some browsers, making "instant" scroll smooth and causing jank.
 */
function scrollToSubmit(watchMs = 6000) {
  const el = document.getElementById("submit");
  if (!el) return;

  const scrollContainer = document.getElementById("page-main");

  function getTargetScrollTop(): number {
    if (!scrollContainer) return 0;
    const containerTop = scrollContainer.getBoundingClientRect().top;
    const elTop = el!.getBoundingClientRect().top;
    const marginTop = parseFloat(getComputedStyle(el!).scrollMarginTop) || 0;
    return scrollContainer.scrollTop + (elTop - containerTop) - marginTop;
  }

  if (scrollContainer) {
    scrollContainer.scrollTop = getTargetScrollTop();
  } else {
    el.scrollIntoView({ behavior: "instant", block: "start" });
  }

  const stage = document.querySelector<HTMLElement>(".infinite-stage");
  if (!stage) return;

  const deadline = Date.now() + watchMs;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const obs = new ResizeObserver(() => {
    if (Date.now() > deadline) { obs.disconnect(); return; }
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      if (scrollContainer) {
        scrollContainer.scrollTop = getTargetScrollTop();
      } else {
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }
    }, 60);
  });

  obs.observe(stage);
  const timer = setTimeout(() => obs.disconnect(), watchMs);
  window.addEventListener("provider-switch", () => {
    clearTimeout(timer);
    if (debounce) clearTimeout(debounce);
    obs.disconnect();
  }, { once: true });
}

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (pathname === "/" && shouldScrollRef.current) {
      shouldScrollRef.current = false;
      scrollToSubmit();
    }
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      scrollToSubmit();
    } else {
      shouldScrollRef.current = true;
      router.push("/");
    }
  };

  return (
    <a href="/#submit" className={className} onClick={handleClick}>
      Share
    </a>
  );
}
