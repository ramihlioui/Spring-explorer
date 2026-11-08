import { topicById, topics, views, type Node } from "@/content";
import { getT } from "@/lib/text";

export interface SearchEntry {
  k: "topic" | "trail" | "section";
  t: string;
  s: string;
  href: string;
  text?: string;
}

function keys(n: Node, out: string[]) {
  switch (n.t) {
    case "block":
      if (n.h3) out.push(n.h3);
      n.children.forEach((c) => keys(c, out));
      break;
    case "p":
    case "label":
    case "strong":
    case "big":
      out.push(n.html);
      break;
    case "table":
      out.push(...n.head, ...n.rows.flat());
      break;
    case "cols":
    case "panel":
    case "div":
    case "card":
    case "pair":
      n.children.forEach((c) => keys(c, out));
      break;
    case "flow":
      n.boxes.forEach((b) => out.push(b.b, b.small));
      break;
    case "tree":
      n.rows.forEach((r) => out.push(r.html));
      break;
  }
}
const plain = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const cache = new Map<string, SearchEntry[]>();

/** Every topic, trail and section, with the section text, so a visitor can search the lessons themselves. */
export async function buildSearchIndex(locale: string): Promise<SearchEntry[]> {
  const hit = cache.get(locale);
  if (hit) return hit;
  const t = await getT(locale);
  const out: SearchEntry[] = [];
  for (const tp of topics) {
    if (tp.id === "start") continue;
    out.push({ k: "topic", t: t(tp.name), s: t(tp.sub), href: `/${tp.id}` });
    tp.flows.forEach((f, i) => out.push({ k: "trail", t: t(f.t), s: `${t(tp.name)} - ${t(f.s)}`, href: `/${tp.id}?go=${i}` }));
  }
  for (const [id, v] of Object.entries(views)) {
    const tp = topicById(id);
    if (!tp) continue;
    for (const n of v.children) {
      if (n.t !== "block" || !n.id || !n.h3) continue;
      const ks: string[] = [];
      keys(n, ks);
      out.push({ k: "section", t: plain(t(n.h3)), s: t(tp.name), href: `/${id}#${n.id}`, text: plain(ks.map(t).join(" ")) });
    }
  }
  cache.set(locale, out);
  return out;
}
