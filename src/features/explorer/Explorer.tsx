"use client";

import { useEffect, useRef } from "react";
import { createExplorer, type ExplorerApi } from "@/features/explorer/engine";
import { live, setActive } from "@/features/explorer/registry";
import type { ExplorerCfg, ExplorerUi } from "@/features/explorer/types";

export const EXPLORER_EVENT = "explorer:set";
export const EXPLORER_CHANGED = "explorer:changed";

/** Mounts the imperative explorer. `scenarioKey` lets the page switch trail from outside (patterns picker, rail, search). */
export default function Explorer({
  id,
  cfg,
  ui,
  scenarioKey,
}: {
  id: string;
  cfg: ExplorerCfg;
  ui: ExplorerUi;
  scenarioKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ExplorerApi | null>(null);
  const want = useRef(scenarioKey);
  useEffect(() => {
    want.current = scenarioKey;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const raw = new URLSearchParams(window.location.search).get(id);
    const dot = raw ? raw.lastIndexOf(".") : -1;
    const shared = raw && dot > 0 && cfg.scenarios[raw.slice(0, dot)] ? { key: raw.slice(0, dot), step: Number(raw.slice(dot + 1)) || 0 } : null;
    const api = createExplorer(el, id, cfg, ui, {
      onActive: setActive,
      onScenario: (k) => window.dispatchEvent(new CustomEvent(EXPLORER_CHANGED, { detail: { id, key: k } })),
      startKey: want.current ?? shared?.key,
      startStep: shared?.step,
      onStep: cfg.autoplay
        ? undefined
        : (k, n) => {
            const u = new URL(window.location.href);
            u.searchParams.set(id, `${k}.${n}`);
            window.history.replaceState(null, "", u);
          },
    });
    apiRef.current = api;
    if (shared) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    live.add(api);
    const onSet = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; key: string }>).detail;
      if (d.id === id) api.set(d.key);
    };
    window.addEventListener(EXPLORER_EVENT, onSet);
    return () => {
      window.removeEventListener(EXPLORER_EVENT, onSet);
      live.delete(api);
      api.destroy();
      apiRef.current = null;
      el.innerHTML = "";
    };
  }, [id, cfg, ui]);
  useEffect(() => {
    if (scenarioKey && apiRef.current && apiRef.current.key() !== scenarioKey) apiRef.current.set(scenarioKey);
  }, [scenarioKey]);
  return <div id={id} ref={ref} className="seq-host" />;
}
