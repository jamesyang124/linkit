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
      document
        .getElementById("submit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
