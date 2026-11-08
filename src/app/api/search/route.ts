import { routing } from "@/i18n/routing";
import { buildSearchIndex } from "@/lib/search-index";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("locale") ?? routing.defaultLocale;
  const locale = (routing.locales as readonly string[]).includes(q) ? q : routing.defaultLocale;
  return Response.json(await buildSearchIndex(locale), { headers: { "Cache-Control": "public, max-age=3600" } });
}
