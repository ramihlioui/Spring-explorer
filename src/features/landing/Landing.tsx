import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { figure, paths, topics } from "@/content";
import { getT } from "@/lib/text";
import { resolveExplorer, resolveUi } from "@/lib/resolve";
import Explorer from "@/features/explorer/Explorer";
import Icon from "@/components/Icon";
import TopicIndex from "@/features/landing/TopicIndex";
import SearchButton from "@/features/landing/SearchButton";

const LAYERS: { key: "leaves" | "stem" | "roots" | "tools" | "plant"; links: [string, string][]; note?: boolean }[] = [
  { key: "leaves", links: [["security", "security"], ["batch", "batch"], ["data", "data"], ["jpa", "jpa"], ["web", "web"], ["security", "authserver"], ["apidocs", "apidocs"], ["cloud", "cloud"], ["messaging", "messaging"]], note: true },
  { key: "stem", links: [["boot", "boot"]] },
  { key: "roots", links: [["spring", "spring"], ["injection", "injection"], ["beans", "beans"], ["aop", "aop"], ["config", "config"], ["errors", "errors"], ["transactions", "transactions"], ["testing", "testing"], ["runtime", "runtime"], ["patterns", "patterns"], ["troubleshooting", "troubleshooting"], ["compare", "compare"]] },
  { key: "tools", links: [["tools", "lombok"], ["tools", "mapstruct"]] },
  { key: "plant", links: [["capstone", "capstone"], ["project", "project"]] },
];

export default async function Landing({ locale }: { locale: string }) {
  const t = await getT(locale);
  const u = await getTranslations({ locale, namespace: "ui.landing" });
  const raw = (k: string) => u.raw(k) as string;
  const rows = u.raw("table.rows") as string[][];
  const head = u.raw("table.head") as string[];
  const list = topics.filter((x) => x.id !== "start").map((x) => ({ id: x.id, name: t(x.name), blurb: t(x.blurb) }));

  return (
    <section className="view">
      <div className="hero">
        <div className="hero-copy">
          <h2>
            {u("headA")} <span className="mark">{u("headMark")}</span> {u("headB")}
          </h2>
          <p className="lede">{u("lede")}</p>
          <div className="hero-cta">
            <Link className="btn primary lg" href="/spring">
              <span>{u("cta")}</span>
              <Icon name="arrow" />
            </Link>
            <SearchButton>{u("search")}</SearchButton>
          </div>
        </div>
        <div className="hero-demo">
          <Explorer id="seq-hero" cfg={resolveExplorer("seq-hero", t)} ui={resolveUi(t)} />
        </div>
      </div>

      <div className="block">
        <h3>{u("start")}</h3>
        <p className="why">{u("startHint")}</p>
        <TopicIndex
          items={list}
          paths={paths.map((p) => ({ name: t(p.n), desc: t(p.d), steps: p.steps }))}
          figures={figure}
          allLabel={u("allTopics")}
        />
      </div>

      <div className="block">
        <h3>{u("fits")}</h3>
        <p className="why">{u("fitsWhy")}</p>
        <div className="layers">
          {LAYERS.map((l) => (
            <div className="layer" key={l.key}>
              <h4>
                {u(`layers.${l.key}.name`)}
                <small>{u(`layers.${l.key}.sub`)}</small>
              </h4>
              <div>
                {l.links.map(([id, label]) => (
                  <Link key={label} href={`/${id}`}>
                    {u(`link.${label}`)}
                  </Link>
                ))}
                {l.note && <em>{raw("layers.leaves.note")}</em>}
              </div>
            </div>
          ))}
        </div>
        <details className="fold">
          <summary>{u("compare")}</summary>
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  {head.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((c, x) => (
                      <td key={x}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </section>
  );
}
