"use client";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { h32 } from "@/lib/code";

interface Q {
  q: string;
  o: string[];
  a: number;
  w: string;
}

export default function Quiz({ id, questions }: { id: string; questions: Q[] }) {
  const t = useTranslations("ui.quiz");
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const orders = useMemo(
    () =>
      questions.map((q) =>
        q.o
          .map((txt, i) => ({ txt, ok: i === q.a }))
          .sort((x, y) => h32(q.q + x.txt) - h32(q.q + y.txt)),
      ),
    [questions],
  );
  const answered = Object.keys(picked).length;
  const right = Object.entries(picked).filter(([qi, oi]) => orders[+qi][oi].ok).length;
  return (
    <div className="block" id={`quiz-${id}`}>
      <h3>{t("title")}</h3>
      <p className="why">{t("intro")}</p>
      <div className="quiz" key={round}>
        {questions.map((q, qi) => {
          const sel = picked[qi];
          const done = sel !== undefined;
          return (
            <div className="qz" key={qi}>
              <p className="qz-q">
                <span>{qi + 1}</span>
                {q.q}
              </p>
              <div className="qz-opts">
                {orders[qi].map((o, oi) => (
                  <button
                    key={oi}
                    disabled={done}
                    className={done ? (o.ok ? "right" : sel === oi ? "wrong" : "") : ""}
                    onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                  >
                    {o.txt}
                  </button>
                ))}
              </div>
              {done && (
                <p className="qz-why">
                  <b>{orders[qi][sel].ok ? t("correct") : t("notQuite")}</b>
                  <span>{q.w}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>
      <p className="quiz-score" aria-live="polite">
        {answered === questions.length && (
          <>
            <b>{t("score", { right, total: questions.length })}</b> <span>{t("scoreTail")}</span>{" "}
            <button
              className="link"
              onClick={() => {
                setPicked({});
                setRound((r) => r + 1);
              }}
            >
              {t("again")}
            </button>
          </>
        )}
      </p>
    </div>
  );
}
