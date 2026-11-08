# Spring Explorer

A learning portal for Spring. Step through animated flows to see how Spring, Spring Boot, Spring Security and Spring Batch actually work: beans and injection, transactions, requests, authentication flows, testing, errors and more. Every flow shows the code that is running, with the active lines highlighted.

Designed by Rami Hlioui.

- 20 topics, each with interactive explorers, simulators and a quick check
- Nodes and sequence views, predict mode, "what if" switches, shareable links to any step
- Search across topics, trails and lesson text (`Ctrl K` or `/`)
- Light and dark themes, English and French (French text is added by filling `messages/fr.json`)

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build && pnpm start
```

Requires Node 20 or newer. It deploys as a normal Next.js app (Vercel, or any Node host with `pnpm build` then `pnpm start`). No environment variables are needed.

## Stack

Next.js (App Router), React, TypeScript, next-intl, next-themes, and [Hairline](https://github.com/lucasmarkes/hairline) for the topic illustrations.

## Translating

All text lives in `messages/`. `en.json` is complete; `fr.json` starts empty and any missing key falls back to English.

```bash
node scripts/missing-keys.mjs fr          # how many keys are still untranslated
node scripts/missing-keys.mjs fr --list   # which ones
```

To translate a string, copy its path from `en.json` into `fr.json` and translate the value. Keep the inline tags (`<code>`, `<b>`, `<go to="topic">`). To add a language, add it to `src/i18n/routing.ts` and create `messages/<code>.json`.

## Project layout

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Adding a topic

Lesson structure lives in `src/content/*.json` (topics, views, explorers, quizzes, reading links) and points at message keys in `messages/en.json` under `c.*`. Add the structure, add the English text under the same keys, and the topic appears in the menu, search and landing page. Use an existing topic such as `src/content/views.json` → `errors` as a template.

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Development server |
| `pnpm build` / `pnpm start` | Production build and server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript check |
| `pnpm i18n:missing` | Count untranslated French keys |
