"use client";
import { useEffect } from "react";

/** ?theme=dark or ?theme=light on an embed. It only sets the attribute (and keeps it there), so the visitor's saved site theme is untouched. */
export default function EmbedTheme() {
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("theme");
    if (t !== "dark" && t !== "light") return;
    const el = document.documentElement;
    const apply = () => {
      if (el.dataset.theme !== t) el.dataset.theme = t;
    };
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, []);
  return null;
}
