"use client";

import { useId, useState } from "react";

type InfoTooltipProps = {
  content: string;
  label?: string;
  className?: string;
};

export function InfoTooltip({ content, label = "More information", className = "" }: InfoTooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-describedby={id}
        aria-expanded={open}
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-zinc-300 text-xs font-semibold leading-none text-zinc-600 transition hover:border-zinc-950 hover:text-zinc-950 focus:border-zinc-950 focus:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-100 dark:hover:text-zinc-100 dark:focus:border-zinc-100 dark:focus:text-zinc-100 dark:focus:ring-zinc-100/20"
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onPointerEnter={() => setOpen(true)}
        onPointerLeave={() => setOpen(false)}
        onBlur={() => setOpen(false)}
      >
        i
      </button>
      <span
        id={id}
        role="tooltip"
        className={`absolute left-1/2 top-7 z-50 w-64 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-normal leading-relaxed text-zinc-700 shadow-lg shadow-zinc-950/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {content}
      </span>
    </span>
  );
}
