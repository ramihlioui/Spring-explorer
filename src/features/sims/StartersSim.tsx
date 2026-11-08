"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import CodeView from "@/features/sims/CodeView";

export interface Starter {
  k: string;
  art: string;
  on: boolean;
  gives: string[];
}

export default function StartersSim({ starters }: { starters: Starter[] }) {
  const t = useTranslations("ui.starters");
  const [on, setOn] = useState<Record<string, boolean>>(() => Object.fromEntries(starters.map((s) => [s.k, s.on])));
  const sel = starters.filter((s) => on[s.k]);
  const items = sel.flatMap((s) => s.gives);
  const pom = [
    "<dependencies>",
    ...sel.map((s) => `  <dependency>${s.art}</dependency>`),
    sel.length ? "</dependencies>" : `  <!-- ${t("nothing")} -->\n</dependencies>`,
  ];
  return (
    <div className="panel">
      <div className="starters">
        {starters.map((s) => (
          <label key={s.k} className="chk" htmlFor={`st-${s.k}`}>
            <input type="checkbox" id={`st-${s.k}`} checked={!!on[s.k]} onChange={(e) => setOn({ ...on, [s.k]: e.target.checked })} /> {s.k}
          </label>
        ))}
      </div>
      <div className="cols" style={{ marginTop: 16 }}>
        <div>
          <div className="code-label">pom.xml</div>
          <CodeView text={pom} />
        </div>
        <div>
          <div className="code-label">{t("created")}</div>
          <ul className="autolist">
            {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="note">{t("select")}</li>}
          </ul>
          <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="counter">{items.length}</span>
            <span className="note">{t("counter")}</span>
          </div>
        </div>
      </div>
      <p className="note" style={{ marginTop: 12 }}>
        {t("foot")}
      </p>
    </div>
  );
}
