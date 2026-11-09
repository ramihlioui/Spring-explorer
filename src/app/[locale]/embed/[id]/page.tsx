import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { explorers, topics } from "@/content";
import { routing } from "@/i18n/routing";
import { getT } from "@/lib/text";
import { resolveExplorer, resolveUi } from "@/lib/resolve";
import Explorer from "@/features/explorer/Explorer";
import EmbedTheme from "@/features/embed/EmbedTheme";

const ids = Object.keys(explorers).filter((id) => id !== "seq-hero");

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => ids.map((id) => ({ locale, id })));
}

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EmbedPage({ params }: PageProps<"/[locale]/embed/[id]">) {
  const { locale, id } = await params;
  if (!ids.includes(id)) notFound();
  setRequestLocale(locale);
  const t = await getT(locale);
  const u = await getTranslations({ locale, namespace: "ui.embed" });
  const topic = topics.find((tp) => tp.flows.some((f) => f.seq?.[0] === id || f.sel === `#${id}`));
  return (
    <div className="embed">
      <EmbedTheme />
      <div className="panel">
        <Explorer id={id} cfg={resolveExplorer(id, t)} ui={resolveUi(t)} />
      </div>
      <p className="embed-foot">
        <a href={`/${locale}${topic ? `/${topic.id}` : ""}`} target="_blank" rel="noopener noreferrer">
          {u("from")}
        </a>
      </p>
    </div>
  );
}
