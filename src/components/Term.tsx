"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

/** A glossary term: hover, focus or tap to see a one-line definition and a link to learn more. */
export default function Term({ k, children }: { k: string; children: ReactNode }) {
  const t = useTranslations("ui.glossary");
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const card = useRef<HTMLSpanElement>(null);
  const id = useId();
  const leave = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = () => {
    clearTimeout(leave.current);
    setOpen(true);
  };
  const hide = () => {
    clearTimeout(leave.current);
    leave.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    if (!open || !card.current) return;
    const r = card.current.getBoundingClientRect();
    const over = r.right - (window.innerWidth - 16);
    setShift(over > 0 ? -over : r.left < 16 ? 16 - r.left : 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span className="term" onMouseEnter={show} onMouseLeave={hide}>
      <button type="button" className="term-w" aria-describedby={open ? id : undefined} aria-expanded={open} onFocus={show} onBlur={hide} onClick={() => setOpen((o) => !o)}>
        {children}
      </button>
      {open && (
        <span ref={card} id={id} role="tooltip" className="term-card" style={{ transform: `translateX(${shift}px)` }}>
          <b>{t(`${k}.t`)}</b>
          <span>{t(`${k}.d`)}</span>
          <Link href={`/${t(`${k}.topic`)}`} className="link">
            {t("learn")}
          </Link>
        </span>
      )}
    </span>
  );
}
