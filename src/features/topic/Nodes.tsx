import type { CSSProperties, ReactNode } from "react";
import { code as codeById, type Node } from "@/content";
import type { T } from "@/lib/text";
import { resolveExplorer, resolveUi, type ResolvedSims } from "@/lib/resolve";
import CodeBox from "@/components/CodeBox";
import Explorer from "@/features/explorer/Explorer";
import BatchCode from "@/features/sims/BatchCode";
import BatchSim from "@/features/sims/BatchSim";
import BeansSim from "@/features/sims/BeansSim";
import ChainSim from "@/features/sims/ChainSim";
import PatternsSim from "@/features/sims/PatternsSim";
import StartersSim from "@/features/sims/StartersSim";
import Rich from "@/components/Rich";

const style = (s?: string): CSSProperties | undefined => {
  if (!s) return undefined;
  const o: Record<string, string> = {};
  for (const part of s.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    o[k.startsWith("--") ? k : k.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = part.slice(i + 1).trim();
  }
  return o as CSSProperties;
};

export default function Nodes({ nodes, t, sims }: { nodes: Node[]; t: T; sims: ResolvedSims }): ReactNode {
  const R = (k: string) => <Rich html={t(k)} />;
  return nodes.map((n, i) => {
    switch (n.t) {
      case "block":
        return (
          <div className="block" id={n.id || undefined} key={i}>
            {n.h3 && <h3>{R(n.h3)}</h3>}
            <Nodes nodes={n.children} t={t} sims={sims} />
          </div>
        );
      case "p":
        return (
          <p key={i} className={n.cls || undefined} style={style(n.style)}>
            {R(n.html)}
          </p>
        );
      case "label":
        return (
          <div key={i} className="code-label">
            {R(n.html)}
          </div>
        );
      case "strong":
        return <b key={i}>{R(n.html)}</b>;
      case "big":
        return (
          <div key={i} className={n.cls} style={style(n.style)}>
            {R(n.html)}
          </div>
        );
      case "code":
        return n.id === "batch-code" ? <BatchCode key={i} /> : <CodeBox key={i} id={n.id} text={codeById[n.id] ?? ""} />;
      case "table":
        return (
          <div className="tbl-wrap" key={i} style={style(n.style)}>
            <table>
              <thead>
                <tr>
                  {n.head.map((h, x) => (
                    <th key={x}>{R(h)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {n.rows.map((r, y) => (
                  <tr key={y}>
                    {r.map((c, x) => (
                      <td key={x}>{R(c)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "cols":
        return (
          <div className="cols" key={i} style={style(n.style)}>
            <Nodes nodes={n.children} t={t} sims={sims} />
          </div>
        );
      case "panel":
        return (
          <div className="panel" key={i} style={style(n.style)}>
            <Nodes nodes={n.children} t={t} sims={sims} />
          </div>
        );
      case "pair":
        return (
          <div className="pair" key={i}>
            {n.children.map((c, x) => (
              <div key={x}>{"children" in c && <Nodes nodes={c.children} t={t} sims={sims} />}</div>
            ))}
          </div>
        );
      case "div":
      case "card":
        return (
          <div key={i} style={style(n.style)}>
            <Nodes nodes={n.children} t={t} sims={sims} />
          </div>
        );
      case "flow":
        return (
          <div className="flow" key={i}>
            {n.boxes.map((b, x) => (
              <span key={x} style={{ display: "contents" }}>
                {x > 0 && <span className="ar">→</span>}
                <div className="box">
                  <b>{R(b.b)}</b>
                  <small>{R(b.small)}</small>
                </div>
              </span>
            ))}
          </div>
        );
      case "tree":
        return (
          <div className="tree" key={i}>
            {n.rows.map((r, x) => (
              <div className={`tn ${r.cls}`} key={x}>
                <code>{r.code}</code>
                <span>{R(r.html)}</span>
              </div>
            ))}
          </div>
        );
      case "explorer":
        return (
          <div className="panel" key={i}>
            <Explorer id={n.id} cfg={resolveExplorer(n.id, t)} ui={resolveUi(t)} />
          </div>
        );
      case "sim":
        switch (n.name) {
          case "beans":
            return <BeansSim key={i} beans={sims.beans} />;
          case "starters":
            return <StartersSim key={i} starters={sims.starters} />;
          case "sims-chain":
            return <ChainSim key={i} scen={sims.scen} filters={sims.filters} />;
          case "batch":
            return <BatchSim key={i} recs={sims.recs} />;
          case "patterns":
            return <PatternsSim key={i} pats={sims.pats} cfg={resolveExplorer("seq-pat", t)} ui={resolveUi(t)} />;
        }
        return null;
    }
  });
}

export { BatchCode };
