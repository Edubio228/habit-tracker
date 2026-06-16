"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Theme = "light" | "dark";

function getStoredTheme(): Theme | null {
  const storedTheme = localStorage.getItem("theme");

  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return null;
}

function getTheme(): Theme {
  const storedTheme = getStoredTheme();

  if (storedTheme) {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTheme(getTheme());
      setMounted(true);
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (!getStoredTheme()) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      cancelAnimationFrame(frame);
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";

    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    setTheme(nextTheme);
  }

  return (
    <Button type="button" variant="secondary" aria-label={`Switch dark mode ${theme === "dark" ? "off" : "on"}`} role="switch" aria-checked={theme === "dark"} onClick={toggleTheme} disabled={!mounted} className="inline-flex items-center gap-2 px-3 py-2">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Off</span>
      <span className={`relative h-6 w-11 rounded-full transition ${theme === "dark" ? "bg-zinc-950 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-700"}`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${theme === "dark" ? "left-6" : "left-1"}`} />
      </span>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">On</span>
    </Button>
  );
}
