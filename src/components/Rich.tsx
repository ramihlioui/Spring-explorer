import { Fragment, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import Term from "./Term";

const decode = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

/** Renders the small inline markup used in lesson text: <code>, <b>, <i>, <kbd>, <br>, <go to="topic">. */
export default function Rich({ html }: { html: string }) {
  const re = /<(\/?)(code|b|i|kbd|go|term)((?:\s[^>]*)?)>|<br\s*\/?>/g;
  type Frame = { tag: string; attrs: string; kids: ReactNode[] };
  const stack: Frame[] = [{ tag: "", attrs: "", kids: [] }];
  let last = 0,
    k = 0,
    m: RegExpExecArray | null;
  const top = () => stack[stack.length - 1];
  while ((m = re.exec(html))) {
    if (m.index > last) top().kids.push(decode(html.slice(last, m.index)));
    last = re.lastIndex;
    if (m[0].startsWith("<br")) top().kids.push(<br key={k++} />);
    else if (!m[1]) stack.push({ tag: m[2], attrs: m[3] ?? "", kids: [] });
    else if (stack.length > 1) {
      const f = stack.pop()!;
      const kids = f.kids;
      const key = k++;
      top().kids.push(
        f.tag === "code" ? (
          <code key={key}>{kids}</code>
        ) : f.tag === "b" ? (
          <b key={key}>{kids}</b>
        ) : f.tag === "i" ? (
          <i key={key}>{kids}</i>
        ) : f.tag === "kbd" ? (
          <kbd key={key}>{kids}</kbd>
        ) : f.tag === "term" ? (
          <Term key={key} k={/k="([^"]+)"/.exec(f.attrs)?.[1] ?? ""}>
            {kids}
          </Term>
        ) : (
          <Link key={key} className="link" href={`/${/to="([^"]+)"/.exec(f.attrs)?.[1] ?? ""}`}>
            {kids}
          </Link>
        ),
      );
    }
  }
  if (last < html.length) top().kids.push(decode(html.slice(last)));
  while (stack.length > 1) {
    const f = stack.pop()!;
    top().kids.push(...f.kids);
  }
  return (
    <>
      {stack[0].kids.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </>
  );
}
