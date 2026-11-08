"use client";
import { useMemo, useSyncExternalStore } from "react";
import { EXPLORER_EVENT } from "@/features/explorer/Explorer";

/** A trail is one "jump to" target on a topic page: a section, optionally with one scenario preselected. */
export interface FlowLite {
  sel: string | null;
  seq: [string, string] | null;
  pat: string | null;
  t: string;
  s: string;
}
export const PATTERN_EVENT = "pattern:set";

const KEY = "spring-explorer-seen";
let seen = new Set<string>();
let loaded = false;
let snap = "[]";
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    seen = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {}
  snap = JSON.stringify([...seen]);
}
export function markSeen(topic: string, i: number) {
  load();
  const k = `${topic}:${i}`;
  if (seen.has(k)) return;
  seen.add(k);
  snap = JSON.stringify([...seen]);
  try {
    localStorage.setItem(KEY, snap);
  } catch {}
  subs.forEach((f) => f());
}
export function useSeen(): Set<string> {
  const s = useSyncExternalStore(
    (fn) => {
      subs.add(fn);
      return () => subs.delete(fn);
    },
    () => {
      load();
      return snap;
    },
    () => "[]",
  );
  return useMemo(() => new Set<string>(JSON.parse(s)), [s]);
}

export function runTrail(flow: FlowLite) {
  if (flow.seq) window.dispatchEvent(new CustomEvent(EXPLORER_EVENT, { detail: { id: flow.seq[0], key: flow.seq[1] } }));
  if (flow.pat) window.dispatchEvent(new CustomEvent(PATTERN_EVENT, { detail: { k: flow.pat } }));
  requestAnimationFrame(() => {
    const el = flow.sel && document.querySelector(flow.sel);
    if (!el) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    const ex = el.matches(".seq") ? el : el.querySelector(".seq");
    if (ex) {
      ex.classList.remove("flash");
      void (ex as HTMLElement).offsetWidth;
      ex.classList.add("flash");
      setTimeout(() => ex.classList.remove("flash"), 1400);
    }
  });
}
