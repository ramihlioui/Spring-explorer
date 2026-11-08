import type { ExplorerApi } from "@/features/explorer/engine";

/** Every mounted explorer, so the keyboard shortcuts can drive the one the visitor is using. */
export const live = new Set<ExplorerApi>();
let active: ExplorerApi | null = null;
export const setActive = (a: ExplorerApi) => {
  active = a;
};
export function activeExplorer(): ExplorerApi | null {
  if (active && live.has(active) && active.root.offsetParent !== null) return active;
  return [...live].find((s) => s.root.offsetParent !== null) ?? null;
}
