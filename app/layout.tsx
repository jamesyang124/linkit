import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";
import { Toast } from "@/components/toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "Linkit",
  description: "Share links, discuss them, and track what people visit."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        <div id="page-main">
          {children}
        </div>
        <Toast />
      </body>
    </html>
  );
}
