import { getTranslations } from "next-intl/server";
import { figure, firstBlock, headline, interview, quiz, read, topicById, views } from "@/content";
import { getT } from "@/lib/text";
import { resolveSims } from "@/lib/resolve";
import type { FlowLite } from "@/features/topic/trail";
import DeepLink from "@/features/topic/DeepLink";
import HairlineFigure from "@/components/HairlineFigure";
import Icon from "@/components/Icon";
import Nodes from "@/features/topic/Nodes";
import Quiz from "@/features/topic/Quiz";
import Rail from "@/features/topic/Rail";
import Rich from "@/components/Rich";
import TrailButton from "@/features/topic/TrailButton";

export default async function TopicView({ id, locale }: { id: string; locale: string }) {
  const topic = topicById(id)!;
  const view = views[id];
  const t = await getT(locale);
  const u = await getTranslations({ locale, namespace: "ui.topic" });
  const sims = resolveSims(t);

  const flows: FlowLite[] = topic.flows.map((f) => ({ sel: f.sel, seq: f.seq, pat: f.pat, t: t(f.t), s: t(f.s) }));
  const qs = quiz[id];

  const first = firstBlock[id];
  const nodes = [...view.children];
  const fi = first ? nodes.findIndex((n) => n.t === "block" && n.id === first) : -1;
  if (fi > 0) nodes.unshift(...nodes.splice(fi, 1));

  const questions = qs?.map((q) => ({ a: q.a, q: t(q.q), o: q.o.map(t), w: t(q.w) }));
  const reads = read[id];
  const qa = interview[id];

  return (
    <section className="view">
      <header className="thead">
        <div className="thead-copy">
          <div className="thead-h">
            <h2>
              <Rich html={t(headline[id] ?? view.h2)} />
            </h2>
          </div>
          <div className="thead-sub">
            <p className="sub">
              <Rich html={t(view.sub)} />
            </p>
          </div>
          <div className="trails">
            <span className="trails-l">{u("jumpTo")}</span>
            {flows.map((f, i) => (
              <TrailButton key={i} className="tchip" topic={id} index={i} flow={f} title={f.s}>
                <i>{i + 1}</i>
                <span>{f.t}</span>
              </TrailButton>
            ))}
          </div>
        </div>
        {figure[id] && <HairlineFigure name={figure[id]} />}
      </header>
      <div className="tbody">
        <Rail topic={id} flows={flows} />
        <div className="tcontent">
          <Nodes nodes={nodes} t={t} sims={sims} />
          {questions && <Quiz id={id} questions={questions} />}
          {qa && (
            <div className="block" id={`interview-${id}`}>
              <h3>{u("interview")}</h3>
              <p className="why">{u("interviewHint")}</p>
              <div className="qa">
                {qa.map((x, i) => (
                  <details key={i}>
                    <summary>{t(x.q)}</summary>
                    <div className="qa-a">
                      <Rich html={t(x.a)} />
                    </div>
                  </details>
                ))}
              </div>
            </div>
          )}
          {reads && (
            <div className="block" id={`next-${id}`}>
              <h3>{u("goDeeper")}</h3>
              <ul className="reads">
                {reads.map((r) => (
                  <li key={r.url}>
                    <a href={r.url} target="_blank" rel="noopener noreferrer">
                      <span>{t(r.n)}</span>
                      <Icon name="out" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <DeepLink topic={id} flows={flows} />
    </section>
  );
}
