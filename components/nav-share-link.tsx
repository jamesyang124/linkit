"use client";

import { usePathname } from "next/navigation";

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === "/") {
      e.preventDefault();
      document
        .getElementById("submit")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Cross-page: let href="/#submit" navigate normally; browser scrolls
    // the nearest scrollable ancestor (#page-main) after load.
  };

  return (
    <a href="/#submit" className={className} onClick={handleClick}>
      Share
    </a>
  );
}
