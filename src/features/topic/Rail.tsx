"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { EXPLORER_CHANGED } from "@/features/explorer/Explorer";
import { markSeen, runTrail, useSeen, type FlowLite } from "@/features/topic/trail";
import { PATTERN_EVENT } from "@/features/topic/trail";

/** The "in this topic" list: remembers which trails this visitor has opened and follows the page as it scrolls. */
export default function Rail({ topic, flows }: { topic: string; flows: FlowLite[] }) {
  const t = useTranslations("ui.topic");
  const seen = useSeen();
  const [now, setNow] = useState<number | null>(null);
  const done = flows.filter((_, i) => seen.has(`${topic}:${i}`)).length;

  useEffect(() => {
    const els = new Map<Element, number[]>();
    flows.forEach((f, i) => {
      const el = f.sel && document.querySelector(f.sel);
      if (el) els.set(el, [...(els.get(el) ?? []), i]);
    });
    const pick = (idxs: number[]) => {
      let p = idxs[0];
      const withSeq = idxs.find((i) => flows[i].seq);
      if (withSeq != null) {
        const sid = flows[withSeq].seq![0];
        const cur = (window as unknown as { __ex?: Record<string, string> }).__ex?.[sid];
        const m = idxs.find((i) => flows[i].seq && flows[i].seq![1] === cur);
        if (m != null) p = m;
      }
      return p;
    };
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((en) => {
          if (!en.isIntersecting) return;
          const p = pick(els.get(en.target)!);
          setNow(p);
          markSeen(topic, p);
        }),
      { threshold: 0.45 },
    );
    els.forEach((_, el) => io.observe(el));
    const onChange = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; key: string }>).detail;
      const w = window as unknown as { __ex?: Record<string, string> };
      (w.__ex ??= {})[d.id] = d.key;
      const i = flows.findIndex((f) => f.seq && f.seq[0] === d.id && f.seq[1] === d.key);
      if (i >= 0) {
        setNow(i);
        markSeen(topic, i);
      }
    };
    const onPat = (e: Event) => {
      const k = (e as CustomEvent<{ k: string }>).detail.k;
      const i = flows.findIndex((f) => f.pat === k);
      if (i >= 0) {
        setNow(i);
        markSeen(topic, i);
      }
    };
    window.addEventListener(EXPLORER_CHANGED, onChange);
    window.addEventListener(PATTERN_EVENT, onPat);
    return () => {
      io.disconnect();
      window.removeEventListener(EXPLORER_CHANGED, onChange);
      window.removeEventListener(PATTERN_EVENT, onPat);
    };
  }, [flows, topic]);

  return (
    <nav className="rail" aria-label={t("inThisTopic")}>
      <div className="rail-h">
        <span>{t("inThisTopic")}</span>
        <span className="rail-p">{t("progress", { done, total: flows.length })}</span>
      </div>
      <ol>
        {flows.map((f, i) => (
          <li key={i} className={`${seen.has(`${topic}:${i}`) ? "seen" : ""} ${now === i ? "now" : ""}`}>
            <button
              onClick={() => {
                markSeen(topic, i);
                setNow(i);
                runTrail(f);
              }}
            >
              {f.t}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
