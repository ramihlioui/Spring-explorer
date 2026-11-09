import { getTranslations } from "next-intl/server";
import { groups, topicById } from "@/content";
import { getT } from "@/lib/text";
import Chrome from "@/features/chrome/Chrome";

export default async function SiteLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  const t = await getT(locale);
  const menu = groups.map((g) => ({
    name: t(g.name),
    items: g.ids.map((id) => ({ id, name: t(topicById(id)!.name), sub: t(topicById(id)!.sub) })),
  }));
  const names = Object.fromEntries(menu.flatMap((g) => g.items.map((i) => [i.id, i.name])));
  const foot = await getTranslations({ locale, namespace: "ui" });
  return (
    <div className="app">
      <Chrome menu={menu} names={names} />
      <main className="stage">{children}</main>
      <footer className="foot">
        <span>{foot("footer")}</span>
        <span className="credit">{foot("credit")}</span>
      </footer>
    </div>
  );
}
