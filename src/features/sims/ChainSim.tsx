"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface Filter {
  id: string;
  name: string;
  does: string;
}
interface Scen {
  label: string;
  req: string;
  hdr: string;
  stop: string | null;
  okstop?: boolean;
  status: number;
  name: string;
  ctx: string;
  why: string;
  notes: Record<string, string>;
}
type St = "pass" | "stop" | "skip" | null;

export default function ChainSim({ scen, filters }: { scen: Scen[]; filters: Filter[] }) {
  const t = useTranslations("ui.chain");
  const [sc, setSc] = useState(0);
  const [states, setStates] = useState<St[]>(filters.map(() => null));
  const [done, setDone] = useState(false);
  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const play = useCallback(
    (idx: number) => {
      const my = ++run.current;
      clearTimeout(timer.current);
      const s = scen[idx];
      const stopIdx = s.stop ? filters.findIndex((f) => f.id === s.stop) : filters.length;
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const st: St[] = filters.map(() => null);
      setStates([...st]);
      setDone(false);
      let i = 0;
      (function tick() {
        if (my !== run.current) return;
        if (i >= filters.length || i > stopIdx) {
          setDone(true);
          return;
        }
        st[i] = i === stopIdx ? "stop" : "pass";
        if (i === stopIdx) {
          for (let j = i + 1; j < filters.length; j++) st[j] = "skip";
          setStates([...st]);
          setDone(true);
          return;
        }
        setStates([...st]);
        i++;
        timer.current = setTimeout(tick, reduce ? 0 : 380);
      })();
    },
    [scen, filters],
  );

  useEffect(() => {
    play(sc);
    return () => {
      run.current++;
      clearTimeout(timer.current);
    };
  }, [sc, play]);

  const s = scen[sc];
  const cls = s.status < 300 ? "s2" : s.status === 401 ? "s4" : "s403";
  return (
    <>
      <div className="cols">
        <div className="panel" style={{ marginTop: 0 }}>
          <div className="code-label">{t("choose")}</div>
          <div className="scen">
            {scen.map((x, i) => (
              <button key={i} aria-pressed={i === sc} onClick={() => setSc(i)}>
                <b>{x.label}</b>
                <small>{x.req}</small>
              </button>
            ))}
          </div>
          <div className="ctl" style={{ marginTop: 12 }}>
            <button className="btn" onClick={() => play(sc)}>
              {t("replay")}
            </button>
          </div>
        </div>
        <div className="panel" style={{ marginTop: 0 }}>
          <div className="code-label">{t("order")}</div>
          <div className="chain">
            {filters.map((f, i) => {
              const state = states[i];
              const isOkStop = done && state === "stop" && !!s.okstop;
              const mark = state === "pass" || isOkStop ? "✓" : state === "stop" ? "✕" : "";
              const note = state && state !== "skip" ? s.notes[f.id] || t("passed") : "";
              return (
                <div key={f.id} className={`fnode ${state || ""} ${isOkStop ? "okstop" : ""}`}>
                  <span className="dot">{mark}</span>
                  <div>
                    <b>{f.name}</b>
                    <p>{f.does}</p>
                    {note && <div className="res">{note}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="panel">
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div className="code-label">{t("response")}</div>
            <div className={`status ${done ? cls : ""}`}>{done ? s.status : "…"}</div>
            <div className="note">{done ? s.name : ""}</div>
          </div>
          <div style={{ flex: "1 1 280px", minWidth: 0 }}>
            <p>{done ? s.why : ""}</p>
            {done && (
              <dl className="facts">
                <dt>{t("request")}</dt>
                <dd>{s.req}</dd>
                <dt>{t("credentials")}</dt>
                <dd>{s.hdr}</dd>
                <dt>SecurityContext</dt>
                <dd>{s.ctx}</dd>
              </dl>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
