"use client";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import HairlineFigure from "@/components/HairlineFigure";
import Icon from "@/components/Icon";

/** The landing index: one Hairline figure that changes as the pointer moves down the list of topics. */
export default function TopicIndex({
  items,
  figures,
}: {
  items: { id: string; name: string; blurb: string }[];
  figures: Record<string, string>;
}) {
  const [id, setId] = useState(items[0]?.id ?? "spring");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const show = (next: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setId(next), 70);
  };
  return (
    <div className="index">
      <ul className="toplist">
        {items.map((t) => (
          <li key={t.id} onPointerOver={() => show(t.id)} onFocus={() => show(t.id)}>
            <Link href={`/${t.id}`}>
              <b>{t.name}</b>
              <span>{t.blurb}</span>
              <Icon name="arrow" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="index-fig">{figures[id] && <HairlineFigure name={figures[id]} />}</div>
    </div>
  );
}
