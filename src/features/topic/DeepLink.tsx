"use client";
import { useEffect } from "react";
import { markSeen, runTrail, type FlowLite } from "@/features/topic/trail";

/** Opens the trail named by ?go=<index> (from search or the landing page), then cleans the address. */
export default function DeepLink({ topic, flows }: { topic: string; flows: FlowLite[] }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    const go = url.searchParams.get("go");
    if (go == null) {
      if (url.hash) requestAnimationFrame(() => document.getElementById(url.hash.slice(1))?.scrollIntoView());
      return;
    }
    const i = Number(go);
    const f = flows[i];
    if (!f) return;
    url.searchParams.delete("go");
    window.history.replaceState(null, "", url.pathname + url.search + (f.sel?.startsWith("#") ? f.sel : ""));
    markSeen(topic, i);
    const id = setTimeout(() => runTrail(f), 80);
    return () => clearTimeout(id);
  }, [topic, flows]);
  return null;
}
