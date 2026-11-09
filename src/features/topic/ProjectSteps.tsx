"use client";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";
import { resetSteps, toggleStep, useDoneSteps } from "./projectStore";

export function DoneToggle({ id }: { id: string }) {
  const t = useTranslations("ui.project");
  const done = useDoneSteps().has(id);
  return (
    <div className="prj-done">
      <button className={`btn${done ? "" : " primary"}`} aria-pressed={done} onClick={() => toggleStep(id)}>
        {done && <Icon name="check" />}
        <span>{done ? t("done") : t("mark")}</span>
      </button>
    </div>
  );
}

export function ProjectProgress({ ids }: { ids: string[] }) {
  const t = useTranslations("ui.project");
  const done = useDoneSteps();
  const n = ids.filter((i) => done.has(i)).length;
  return (
    <div className="prj-progress" role="group" aria-label={t("progress", { done: n, total: ids.length })}>
      <div className="prj-dots">
        {ids.map((i) => (
          <span key={i} className={done.has(i) ? "on" : ""} />
        ))}
      </div>
      <span className="prj-count">{t("progress", { done: n, total: ids.length })}</span>
      {n > 0 && (
        <button className="link" onClick={resetSteps}>
          {t("reset")}
        </button>
      )}
    </div>
  );
}
