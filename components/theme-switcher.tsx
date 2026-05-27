"use client";

import { useEffect, useState } from "react";

const THEMES = [
  { id: "linen", label: "Linen", bg: "#F5F0E8", ink: "#1A1714" },
  { id: "mocha", label: "Mocha", bg: "#EFE7D8", ink: "#2C1A0E" },
  { id: "sage", label: "Sage", bg: "#EBF0E8", ink: "#1A261A" },
  { id: "slate", label: "Slate", bg: "#EDF0F4", ink: "#0F1923" },
  { id: "noir", label: "Noir", bg: "#111111", ink: "#E8E4DC" }
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<ThemeId>("linen");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("linkit-theme") as ThemeId | null;
      if (stored && THEMES.some((t) => t.id === stored)) setTheme(stored);
    } catch {
      // storage blocked
    }
  }, []);

  const applyTheme = (id: ThemeId) => {
    setTheme(id);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", id);
    try {
      localStorage.setItem("linkit-theme", id);
    } catch {
      // storage blocked
    }
  };

  const active = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="theme-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change colour theme"
        title="Theme"
        aria-expanded={open}
      >
        <span
          className="theme-switcher-dot"
          style={{ background: active.bg, borderColor: active.ink }}
        />
        <span className="theme-switcher-label">Theme</span>
      </button>
      {open && (
        <div className="theme-switcher-panel" role="menu">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              role="menuitem"
              className={`theme-swatch${theme === t.id ? " theme-swatch--active" : ""}`}
              onClick={() => applyTheme(t.id)}
              title={t.label}
              aria-label={t.label}
              aria-pressed={theme === t.id}
            >
              <span
                className="theme-swatch-dot"
                style={{ background: t.bg, borderColor: t.ink }}
              />
              <span className="theme-swatch-label">{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
