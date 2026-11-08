import { isoBlock } from "@/features/explorer/engine";

export default function Iso({ cx, cy, label, a, cyl }: { cx: number; cy: number; label: string; a?: number; cyl?: boolean }) {
  return <g dangerouslySetInnerHTML={{ __html: isoBlock(cx, cy, label, { a, cyl }) }} />;
}
