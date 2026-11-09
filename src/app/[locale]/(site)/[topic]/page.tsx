import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { topicById, topicIds } from "@/content";
import { routing } from "@/i18n/routing";
import { getT } from "@/lib/text";
import TopicView from "@/features/topic/TopicView";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => topicIds.map((topic) => ({ locale, topic })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/[topic]">): Promise<Metadata> {
  const { locale, topic } = await params;
  const tp = topicById(topic);
  if (!tp) return {};
  const t = await getT(locale);
  return { title: t(tp.name), description: t(tp.blurb) };
}

export default async function TopicPage({ params }: PageProps<"/[locale]/[topic]">) {
  const { locale, topic } = await params;
  if (!topicIds.includes(topic)) notFound();
  setRequestLocale(locale);
  return <TopicView id={topic} locale={locale} />;
}
