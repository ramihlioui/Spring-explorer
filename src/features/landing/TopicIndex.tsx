"use client";
import { useMemo, useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import HairlineFigure from "@/components/HairlineFigure";
import Icon from "@/components/Icon";

interface Item {
  id: string;
  name: string;
  blurb: string;
}
interface Path {
  name: string;
  desc: string;
  steps: string[];
}

/** One list for the whole portal: every topic, or the same topics in the order of a learning path. */
export default function TopicIndex({
  items,
  paths,
  figures,
  allLabel,
}: {
  items: Item[];
  paths: Path[];
  figures: Record<string, string>;
  allLabel: string;
}) {
  const [tab, setTab] = useState(-1);
  const [id, setId] = useState(items[0]?.id ?? "spring");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const shown = tab < 0 ? items : paths[tab].steps.map((s) => byId[s]).filter(Boolean);
  const show = (next: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setId(next), 70);
  };
  return (
    <>
      <div className="ptabs" role="tablist">
        <button role="tab" aria-selected={tab < 0} onClick={() => setTab(-1)}>
          {allLabel}
        </button>
        {paths.map((p, i) => (
          <button key={p.name} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}>
            {p.name}
          </button>
        ))}
      </div>
      {tab >= 0 && <p className="ptab-desc">{paths[tab].desc}</p>}
      <div className="index">
        <ul className="toplist">
          {shown.map((t, n) => (
            <li key={t.id} onPointerOver={() => show(t.id)} onFocus={() => show(t.id)}>
              <Link href={`/${t.id}`} className={tab >= 0 ? "numbered" : undefined}>
                {tab >= 0 && <i className="num">{n + 1}</i>}
                <b>{t.name}</b>
                <span>{t.blurb}</span>
                <Icon name="arrow" />
              </Link>
            </li>
          ))}
        </ul>
        <div className="index-fig">{figures[id] && <HairlineFigure name={figures[id]} />}</div>
      </div>
    </>
  );
}
