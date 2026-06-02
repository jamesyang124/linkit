"use client";

import { useEffect, useLayoutEffect, useState } from "react";

type ToastMessage = { text: string; tone: "success" | "error" | "info" };

export function Toast() {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  useLayoutEffect(() => {
    const handler = (e: Event) => {
      setIsExiting(false);
      setToast((e as CustomEvent<ToastMessage>).detail);
    };
    window.addEventListener("show-toast", handler);
    return () => window.removeEventListener("show-toast", handler);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const exitTimer = setTimeout(() => setIsExiting(true), 1500);
    const removeTimer = setTimeout(() => setToast(null), 1750);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [toast]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast--${toast.tone}${isExiting ? " toast--exiting" : ""}`}
      role="status"
      aria-live="polite"
      data-testid="toast"
    >
      {toast.text}
    </div>
  );
}

export function showToast(
  text: string,
  tone: "success" | "error" | "info" = "info"
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("show-toast", { detail: { text, tone } }));
}
