import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "@/i18n/routing";

type Dict = { [k: string]: unknown };

/** English fills every key a translation has not covered yet. */
function merge(base: Dict, over: Dict): Dict {
  const out: Dict = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] =
      typeof v === "object" && v && !Array.isArray(v) && typeof b === "object" && b && !Array.isArray(b)
        ? merge(b as Dict, v as Dict)
        : v;
  }
  return out;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;
  const en = (await import("@/../messages/en.json")).default as Dict;
  const messages =
    locale === "en"
      ? en
      : merge(en, (await import(`../../messages/${locale}.json`)).default as Dict);
  return { locale, messages };
});
