# Spring Explorer (Next.js + next-intl)

Run: `pnpm dev`, or `pnpm build && pnpm start`. Deploys to Vercel or any Node host.

## Architecture

```
src/
  app/                    routing only: thin pages that call into features
    [locale]/             layout (fonts, theme, intl provider), landing, [topic]
    api/search/           search index endpoint
  features/               one folder per area of the product
    chrome/               nav bar, topic menu, search + shortcuts dialogs, theme/language switch
    landing/              home page, topic index with hover figure
    topic/                topic page, content node renderer, rail, quiz, deep links, trail memory
    explorer/             the step-by-step engine (nodes, sequence, predict, what-if)
    sims/                 beans, starters, security chain, batch, patterns simulators
  components/             shared pieces: Icon, Sprite, Rich text, CodeBox, CopyButton, HairlineFigure
  content/                typed access to the lesson structure (JSON that points at message keys)
  i18n/                   routing, navigation, request config (English fallback), proxy lives in src/proxy.ts
  lib/                    code highlighting, text lookup, content resolvers, search index
messages/
  en.json                 all text: `ui.*` interface (ICU), `c.*` lesson content (read raw)
  fr.json                 starts as {}; missing keys fall back to English
scripts/                  missing-keys.mjs (translation progress)
```

Rule of thumb: pages in `app/` never hold logic; features own their components; `components/` is only for things two features share.

## Hairline
`@lucasmarkes/hairline` draws the topic header and landing figures (`components/HairlineFigure.tsx`).
The explorer's isometric node blocks are drawn by the engine in the same style.

## Translating
Copy a key's path from `en.json` into `fr.json` and translate the value; keep `<code>`, `<b>`, `<go to="x">` tags.
`node scripts/missing-keys.mjs fr --list` shows what is left.

## Notes
- Lane names (Controller, Proxy, Database...) are identifiers and stay untranslated.
