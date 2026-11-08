"use client";
import { codeHTML } from "@/lib/code";
import CopyButton from "@/components/CopyButton";

/** A code block that re-renders with new text or highlighted lines. */
export default function CodeView({ text, hi }: { text: string | string[]; hi?: number[] }) {
  const raw = Array.isArray(text) ? text.join("\n") : text;
  return (
    <div className="codebox">
      <div className="code" dangerouslySetInnerHTML={{ __html: codeHTML(text, hi) }} />
      <CopyButton text={raw} />
    </div>
  );
}
