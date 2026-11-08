export interface Step {
  f: string; t: string; label: string; note: string;
  hi?: number[]; set?: Record<string, string>; row?: string; ret?: number;
  kind?: "ok" | "bad"; tx?: string; add?: string; badge?: Record<string, string>;
  payload?: string; file?: string;
}
export interface Scenario {
  label: string; stateTitle?: string; lanes: string[]; state?: string;
  code?: string[]; files?: Record<string, string[]>; steps: Step[]; info?: Record<string, string>;
}
export interface ExplorerCfg {
  selector?: boolean; compact?: boolean; autoplay?: boolean; loop?: boolean;
  scenarios: Record<string, Scenario>;
  breakIt?: Record<string, [string, string]>;
  laneInfo: Record<string, string>;
}
/** UI strings the engine needs, already in the visitor's language. */
export type ExplorerUi = Record<string, string>;
