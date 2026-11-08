"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import Icon from "@/components/Icon";

export default function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  const t = useTranslations("ui");
  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {}
    setDone(ok);
    setTimeout(() => setDone(false), 1400);
  }
  return (
    <button className={`copy${done ? " done" : ""}`} type="button" aria-label={t("copyCode")} onClick={copy}>
      <Icon name={done ? "check" : "copy"} />
    </button>
  );
}
