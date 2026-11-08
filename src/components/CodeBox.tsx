import { codeHTML } from "@/lib/code";
import CopyButton from "@/components/CopyButton";

export default function CodeBox({ text, id }: { text: string; id?: string }) {
  return (
    <div className="codebox">
      <div className="code" id={id} dangerouslySetInnerHTML={{ __html: codeHTML(text) }} />
      <CopyButton text={text} />
    </div>
  );
}
