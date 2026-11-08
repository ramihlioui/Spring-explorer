"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PATTERN_EVENT } from "@/features/topic/trail";
import Explorer from "@/features/explorer/Explorer";
import type { ExplorerCfg, ExplorerUi } from "@/features/explorer/types";

interface Pat {
  k: string;
  name: string;
  where: string;
}

export default function PatternsSim({ pats, cfg, ui }: { pats: Pat[]; cfg: ExplorerCfg; ui: ExplorerUi }) {
  const t = useTranslations("ui");
  const [k, setK] = useState(() => {
    if (typeof window === "undefined") return pats[0].k;
    const q = new URLSearchParams(window.location.search).get("pat");
    return pats.some((p) => p.k === q) ? q! : pats[0].k;
  });
  useEffect(() => {
    const on = (e: Event) => setK((e as CustomEvent<{ k: string }>).detail.k);
    window.addEventListener(PATTERN_EVENT, on);
    return () => window.removeEventListener(PATTERN_EVENT, on);
  }, []);
  const cur = pats.find((p) => p.k === k) ?? pats[0];
  return (
    <>
      <div className="patgrid">
        {pats.map((p) => (
          <button key={p.k} className="pat" aria-pressed={p.k === k} onClick={() => setK(p.k)}>
            <b>{p.name}</b>
            <small>{p.where}</small>
          </button>
        ))}
      </div>
      <div className="panel">
        <h3 style={{ fontSize: 21 }}>{cur.name}</h3>
        <p style={{ marginTop: 6 }}>
          <b>{t("inSpring")}</b> {cur.where}
        </p>
        <div style={{ marginTop: 16 }}>
          <Explorer id="seq-pat" cfg={cfg} ui={ui} scenarioKey={k} />
        </div>
      </div>
    </>
  );
}
