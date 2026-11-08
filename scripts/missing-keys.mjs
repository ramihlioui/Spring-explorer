// Usage: node scripts/missing-keys.mjs [locale]   Lists message keys that messages/<locale>.json does not translate yet.
import fs from "node:fs";
const locale = process.argv[2] ?? "fr";
const en = JSON.parse(fs.readFileSync("messages/en.json", "utf8"));
const tr = JSON.parse(fs.readFileSync(`messages/${locale}.json`, "utf8"));
let total = 0,
  missing = 0;
(function walk(a, b, path) {
  for (const [k, v] of Object.entries(a)) {
    const p = path ? `${path}.${k}` : k;
    if (typeof v === "string") {
      total++;
      if (typeof b?.[k] !== "string") {
        missing++;
        if (process.argv.includes("--list")) console.log(p);
      }
    } else walk(v, b?.[k], p);
  }
})(en, tr, "");
console.log(`${locale}: ${total - missing} of ${total} keys translated (${missing} fall back to English)`);
