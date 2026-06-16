"use client";

import { forwardRef } from "react";
import type { LabelHTMLAttributes } from "react";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium text-zinc-700 dark:text-zinc-300 ${className}`}
        {...props}
      />
    );
  },
);

Label.displayName = "Label";
