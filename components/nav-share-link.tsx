"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  // Flag: navigate to "/" was triggered; scroll to #submit once we land there.
  const shouldScrollRef = useRef(false);

  useEffect(() => {
    if (pathname === "/" && shouldScrollRef.current) {
      shouldScrollRef.current = false;
      const el = () => document.getElementById("submit");
      // Initial scroll — smooth for a nice visual landing.
      el()?.scrollIntoView({ behavior: "smooth", block: "start" });
      // Retries with instant so they complete synchronously before further
      // content loads push #submit down again.  Gallery lazy-loads tiles that
      // extend the page over ~3-4 s after navigation.
      const t1 = setTimeout(() => el()?.scrollIntoView({ behavior: "instant", block: "start" }), 1200);
      const t2 = setTimeout(() => el()?.scrollIntoView({ behavior: "instant", block: "start" }), 3000);
      const t3 = setTimeout(() => el()?.scrollIntoView({ behavior: "smooth", block: "start" }), 5000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      // Already on home — scroll directly.
      document
        .getElementById("submit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
