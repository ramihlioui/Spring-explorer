import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export type T = (key: string) => string;

/** Raw lookup: lesson text contains braces and apostrophes, so it never goes through ICU. */
export async function getT(locale: string = routing.defaultLocale): Promise<T> {
  const t = await getTranslations({ locale });
  return (key) => t.raw(key) as string;
}
