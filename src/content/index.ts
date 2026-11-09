import topicsJson from "@/content/topics.json";
import groupsJson from "@/content/groups.json";
import pathsJson from "@/content/paths.json";
import headlineJson from "@/content/headline.json";
import figureJson from "@/content/figure.json";
import firstBlockJson from "@/content/firstBlock.json";
import viewsJson from "@/content/views.json";
import explorersJson from "@/content/explorers.json";
import laneInfoJson from "@/content/laneInfo.json";
import breakItJson from "@/content/breakIt.json";
import quizJson from "@/content/quiz.json";
import readJson from "@/content/read.json";
import simsJson from "@/content/sims.json";
import patsJson from "@/content/pats.json";
import codeJson from "@/content/code.json";
import interviewJson from "@/content/interview.json";

/** Every text field below is a message key ("c.…"), resolved with the visitor's locale. */
export interface Flow {
  sel: string | null;
  seq: [string, string] | null;
  pat: string | null;
  t: string;
  s: string;
}
export interface Topic {
  id: string;
  level: string | null;
  layer: number;
  name: string;
  sub: string;
  blurb: string;
  flows: Flow[];
}
export type Node =
  | { t: "block"; id: string; h3: string; children: Node[] }
  | { t: "p"; cls: string; style: string; html: string }
  | { t: "label" | "strong"; html: string }
  | { t: "big"; cls: string; style: string; html: string }
  | { t: "table"; head: string[]; rows: string[][]; style: string }
  | { t: "cols" | "panel" | "div" | "card" | "pair"; style?: string; children: Node[] }
  | { t: "code"; id: string }
  | { t: "explorer"; id: string }
  | { t: "sim"; name: string }
  | { t: "done"; id: string }
  | { t: "progress"; ids: string[] }
  | { t: "flow"; boxes: { b: string; small: string }[] }
  | { t: "tree"; rows: { cls: string; code: string; html: string }[] };
export interface View {
  h2: string;
  sub: string;
  children: Node[];
}

export const topics = topicsJson as Topic[];
export const topicById = (id: string) => topics.find((t) => t.id === id);
export const groups = groupsJson as { name: string; ids: string[] }[];
export const paths = pathsJson as { n: string; d: string; steps: string[] }[];
export const headline = headlineJson as Record<string, string>;
export const figure = figureJson as Record<string, string>;
export const firstBlock = firstBlockJson as Record<string, string>;
export const views = viewsJson as unknown as Record<string, View>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const explorers = explorersJson as unknown as Record<string, any>;
export const laneInfo = laneInfoJson as Record<string, string>;
export const breakIt = breakItJson as unknown as Record<string, Record<string, [string, string]>>;
export const quiz = quizJson as Record<string, { a: number; q: string; o: string[]; w: string }[]>;
export const read = readJson as Record<string, { n: string; url: string }[]>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sims = simsJson as any;
export const pats = patsJson as { k: string; name: string; cat: string; where: string }[];
export const code = codeJson as Record<string, string>;
export const interview = interviewJson as Record<string, { q: string; a: string }[]>;
export const topicIds = topics.filter((t) => t.id !== "start").map((t) => t.id);
