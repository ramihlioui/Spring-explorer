/* eslint-disable @typescript-eslint/no-explicit-any -- the lesson JSON is untyped structure; resolved output is typed */
import { breakIt, explorers, laneInfo, pats, sims } from "@/content";
import type { ExplorerCfg, ExplorerUi, Scenario } from "@/features/explorer/types";
import type { T } from "@/lib/text";

/** Turns an explorer's structure (message keys) into plain strings in the visitor's language. */
export function resolveExplorer(id: string, t: T): ExplorerCfg {
  const e = explorers[id];
  const scenarios: Record<string, Scenario> = {};
  for (const [k, s] of Object.entries<any>(e.scenarios)) {
    scenarios[k] = {
      label: t(s.label),
      stateTitle: s.stateTitle ? t(s.stateTitle) : undefined,
      lanes: s.lanes,
      state: s.state,
      code: s.code,
      files: s.files,
      steps: s.steps.map((st: any) => ({
        ...st,
        label: t(st.label),
        note: t(st.note),
        add: st.add ? t(st.add) : undefined,
        badge: st.badge ? Object.fromEntries(Object.entries<string>(st.badge).map(([l, b]) => [l, t(b)])) : undefined,
      })),
    };
  }
  const bk = breakIt[id];
  return {
    selector: e.selector,
    compact: e.compact,
    cycle: e.cycle,
    autoplay: e.autoplay,
    loop: e.loop,
    scenarios,
    breakIt: bk ? Object.fromEntries(Object.entries(bk).map(([s, [to, label]]) => [s, [to, t(label)] as [string, string]])) : undefined,
    laneInfo: Object.fromEntries(Object.entries(laneInfo).map(([l, k]) => [l, t(k)])),
  };
}

export const resolveUi = (t: T): ExplorerUi => t("ui.ex") as unknown as ExplorerUi;

export function resolveSims(t: T) {
  return {
    beans: sims.beans.map((b: any) => ({ ...b, why: t(b.why) })),
    starters: sims.starters.map((s: any) => ({ ...s, gives: s.gives.map(t) })),
    filters: sims.filters.map((f: any) => ({ ...f, does: t(f.does) })),
    scen: sims.scen.map((s: any) => ({ ...s, why: t(s.why), notes: Object.fromEntries(Object.entries<string>(s.notes).map(([k, v]) => [k, t(v)])) })),
    recs: sims.recs,
    pats: pats.map((p) => ({ k: p.k, name: t(p.name), where: t(p.where) })),
  };
}
export type ResolvedSims = ReturnType<typeof resolveSims>;
