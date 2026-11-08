"use client";
import type { ReactNode } from "react";

/** Opens the search dialog by sending the same keystroke the shortcut uses. */
export default function SearchButton({ children }: { children: ReactNode }) {
  return (
    <button className="link" onClick={() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "/" }))}>
      {children}
    </button>
  );
}
