import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import { routing } from "@/i18n/routing";
import Sprite from "@/components/Sprite";
import "../globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700", "800"] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ui.meta" });
  return { title: { default: t("title"), template: `%s · ${t("title")}` }, description: t("description") };
}

export default async function LocaleLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const all = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable}`}>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="spring-explorer-theme">
          <NextIntlClientProvider locale={locale} messages={{ ui: (all as { ui: object }).ui }}>
            <Sprite />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
