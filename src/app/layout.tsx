import type { Metadata } from "next";

import { SiteNav } from "@/components/site-nav";
import { Toast } from "@/components/toast";
import { ThemeSwitcher } from "@/components/theme-switcher";

import "./globals.css";

export const metadata: Metadata = {
  title: "Linkit",
  description: "Share links, discuss them, and track what people visit."
};

// Inline script applied before paint to prevent theme flash
const themeScript = `try{var t=localStorage.getItem('linkit-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteNav />
        <div id="page-main">
          {children}
        </div>
        <Toast />
        <ThemeSwitcher />
      </body>
    </html>
  );
}
