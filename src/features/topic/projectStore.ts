"use client";
import { useMemo, useSyncExternalStore } from "react";

const KEY = "spring-explorer-project";
let done = new Set<string>();
let loaded = false;
let snap = "[]";
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    done = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {}
  snap = JSON.stringify([...done]);
}
function commit() {
  snap = JSON.stringify([...done]);
  try {
    localStorage.setItem(KEY, snap);
  } catch {}
  subs.forEach((f) => f());
}
export function toggleStep(id: string) {
  load();
  if (done.has(id)) done.delete(id);
  else done.add(id);
  commit();
}
export function resetSteps() {
  load();
  done = new Set();
  commit();
}
/** Which project steps this visitor has ticked off. Lives in this browser only. */
export function useDoneSteps(): Set<string> {
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
