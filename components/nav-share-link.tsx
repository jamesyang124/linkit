"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldOpenRef = useRef(false);

  useEffect(() => {
    if (pathname === "/" && shouldOpenRef.current) {
      shouldOpenRef.current = false;
      window.dispatchEvent(new Event("show-submit-modal"));
    }
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      window.dispatchEvent(new Event("show-submit-modal"));
    } else {
      shouldOpenRef.current = true;
      router.push("/");
    }
  };

  return (
    <a href="/" className={className} onClick={handleClick}>
      Share
    </a>
  );
}
