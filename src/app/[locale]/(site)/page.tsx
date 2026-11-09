import { setRequestLocale } from "next-intl/server";
import Landing from "@/features/landing/Landing";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Landing locale={locale} />;
}
