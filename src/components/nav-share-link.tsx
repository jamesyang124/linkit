"use client";

import { usePathname, useRouter } from "next/navigation";

export function NavShareLink({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (pathname === "/") {
      window.dispatchEvent(new Event("show-submit-modal"));
    } else {
      router.push("/?share=true");
    }
  };

  return (
    <a href="/" className={className} onClick={handleClick}>
      Share
    </a>
  );
}
