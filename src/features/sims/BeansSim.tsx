"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { animatePacket } from "@/features/explorer/engine";
import CodeView from "@/features/sims/CodeView";
import Iso from "@/features/sims/Iso";

export interface Bean {
  n: string;
  deps: string[];
  file: string;
  code: string;
  why: string;
}
const POS: Record<string, { x: number; y: number }> = {
  OrderController: { x: 260, y: 52 },
  OrderService: { x: 260, y: 140 },
  OrderRepository: { x: 120, y: 228 },
  PaymentClient: { x: 400, y: 228 },
  DataSource: { x: 120, y: 316 },
};
const SCAN_CODE = "// found 5 candidates in com.shop.*\nDataSource, PaymentClient,\nOrderRepository, OrderService,\nOrderController";

export default function BeansSim({ beans }: { beans: Bean[] }) {
  const t = useTranslations("ui.beans");
  const [step, setStep] = useState(0); // 0 nothing, 1 scanned, 2.. created
  const a = 62,
    b = Math.round(a * 0.42),
    d = 14;
  const created = Math.max(0, step - 1),
    ci = created - 1,
    scanned = step >= 1;

  useEffect(() => {
    document.querySelectorAll<SVGPathElement>("[data-bp]").forEach((p) => {
      animatePacket(p, document.getElementById(p.dataset.bp!) as unknown as SVGElement, 900);
    });
  }, [step]);

  const edges = beans.flatMap((bn, i) =>
    bn.deps.map((dn, k) => {
      const A = POS[bn.n],
        B = POS[dn];
      const sx = A.x + (B.x - A.x) * 0.25,
        sy = A.y + b + d + 4,
        ex = B.x,
        ey = B.y - b - 4;
      return { i, k, sx, sy, ex, ey, done: i < created };
    }),
  );
  const cur = step >= 2 ? beans[step - 2] : null;
  const label = step === 0 ? t("startup") : step === 1 ? t("scan") : cur!.file;
  const code = step === 0 ? "SpringApplication.run(App.class, args);" : step === 1 ? SCAN_CODE : cur!.code;
  const why = step === 0 ? t("why0") : step === 1 ? t("why1") : cur!.why + (step === 6 ? " " + t("whyDone") : "");
  const stateOf = (i: number) => (!scanned ? t("notScanned") : i < created ? t("created") : t("waiting"));

  return (
    <div className="panel">
      <div className="ctl">
        <button className="btn primary" disabled={step === 6} onClick={() => setStep((s) => Math.min(6, s + 1))}>
          {t("next")}
        </button>
        <button className="btn" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          {t("back")}
        </button>
        <button className="btn" onClick={() => setStep(0)}>
          {t("reset")}
        </button>
        <span className="note">{step} / 6</span>
      </div>
      <div className="cols" style={{ marginTop: 14 }}>
        <div className="ctxbox">
          <div className="cap">ApplicationContext</div>
          <div>
            <svg viewBox="0 0 520 392" role="img" aria-label={t("graphLabel")}>
              <defs>
                {["n", "cur"].map((k) => (
                  <marker key={k} id={`bg-${k}`} viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto">
                    <path className={`ah-${k}`} d="M1 1L6.5 4L1 7" fill="none" />
                  </marker>
                ))}
              </defs>
              {edges.map((e) => (
                <path
                  key={`${e.i}-${e.k}`}
                  className={`ge ${e.done ? "cur" : ""}`}
                  d={`M${e.sx} ${e.sy} L${e.ex} ${e.ey}`}
                  markerEnd={`url(#${e.done ? "bg-cur" : "bg-n"})`}
                  style={scanned ? undefined : { opacity: 0.4 }}
                />
              ))}
              {edges
                .filter((e) => e.i === ci)
                .map((e) => (
                  <g key={`p-${step}-${e.k}`}>
                    <path data-bp={`bd-${e.i}-${e.k}`} d={`M${e.ex} ${e.ey} L${e.sx} ${e.sy}`} fill="none" stroke="none" />
                    <circle id={`bd-${e.i}-${e.k}`} className="pk" r="4.5" cx={e.ex} cy={e.ey} />
                  </g>
                ))}
              {beans.map((bn, i) => {
                const p = POS[bn.n],
                  done = i < created,
                  isCur = i === ci;
                return (
                  <g
                    key={bn.n}
                    className={`gn ${done ? "made" : ""} ${isCur ? "on tgt up" : ""} ${scanned ? "" : "ghost"}`}
                    tabIndex={0}
                    role="button"
                    aria-label={`${bn.n}, ${stateOf(i)}`}
                    onClick={() => setStep(i + 2)}
                    onKeyDown={(ev) => {
                      if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        setStep(i + 2);
                      }
                    }}
                  >
                    <Iso cx={p.x} cy={p.y} label={bn.n} a={a} />
                    <text className="bd" x={p.x} y={p.y + b + d + 18} textAnchor="middle">
                      {isCur ? t("justCreated") : stateOf(i)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        <div>
          <div className="code-label">{label}</div>
          <CodeView text={code} />
          <div className="narr">{why}</div>
        </div>
      </div>
    </div>
  );
}
