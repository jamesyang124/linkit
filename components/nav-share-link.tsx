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
 */
function scrollToSubmit(watchMs = 6000) {
  const el = document.getElementById("submit");
  if (!el) return;

  // Initial smooth scroll for a nice visual landing.
  el.scrollIntoView({ behavior: "smooth", block: "start" });

  const stage = document.querySelector<HTMLElement>(".infinite-stage");
  if (!stage) return;

  const deadline = Date.now() + watchMs;
  let debounce: ReturnType<typeof setTimeout> | null = null;

  const obs = new ResizeObserver(() => {
    if (Date.now() > deadline) { obs.disconnect(); return; }
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => {
      el.scrollIntoView({ behavior: "instant", block: "start" });
    }, 60);
  });

  obs.observe(stage);
  setTimeout(() => obs.disconnect(), watchMs);
}

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // Flag: navigate to "/" was triggered; scroll to #submit once we land there.
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
      // Already on home — scroll directly.
      scrollToSubmit();
    } else {
      // Cross-page: navigate to "/" then scroll via the effect above.
      // Next.js hash navigation only scrolls window, not the custom #page-main
      // scroll container — so we handle it ourselves.
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
