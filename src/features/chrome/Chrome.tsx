"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { activeExplorer } from "@/features/explorer/registry";
import Icon from "@/components/Icon";
import type { SearchEntry } from "@/lib/search-index";

export interface MenuGroup {
  name: string;
  items: { id: string; name: string; sub: string }[];
}

const useMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

function SearchDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ui.search");
  const locale = useLocale();
  const router = useRouter();
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let dead = false;
    fetch(`/api/search?locale=${locale}`)
      .then((r) => r.json())
      .then((d: SearchEntry[]) => !dead && setEntries(d))
      .catch(() => !dead && setEntries([]));
    input.current?.focus();
    return () => {
      dead = true;
    };
  }, [locale]);

  const results = useMemo(() => {
    if (!entries) return [];
    const toks = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return entries
      .filter((x) => !toks.length || toks.every((tk) => `${x.t} ${x.s} ${x.text ?? ""}`.toLowerCase().includes(tk)))
      .slice(0, 40)
      .map((x) => {
        if (x.k !== "section" || !x.text) return { ...x, sn: x.s };
        const i = toks.length ? x.text.toLowerCase().indexOf(toks[0]) : -1;
        return { ...x, sn: x.s + (i >= 0 ? ` - ...${x.text.slice(Math.max(0, i - 40), i + 80)}...` : "") };
      });
  }, [entries, q]);
  const cur = Math.min(sel, Math.max(0, results.length - 1));
  const pick = (i: number) => {
    const r = results[i];
    if (!r) return;
    onClose();
    router.push(r.href);
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dlg" role="dialog" aria-label={t("label")}>
        <input
          ref={input}
          type="text"
          placeholder={t("placeholder")}
          autoComplete="off"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel(Math.min(results.length - 1, cur + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel(Math.max(0, cur - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              pick(cur);
            }
          }}
        />
        <div className="res">
          {!entries ? (
            <div className="note" style={{ padding: "16px 20px" }}>
              {t("loading")}
            </div>
          ) : results.length ? (
            results.map((x, i) => (
              <button key={x.href + i} aria-selected={i === cur} onClick={() => pick(i)}>
                <span className="k">{t(x.k)}</span>
                <span>
                  <b>{x.t}</b>
                  <br />
                  <small>{x.sn}</small>
                </span>
              </button>
            ))
          ) : (
            <div className="note" style={{ padding: "16px 20px" }}>
              {t("nothing")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KeysDialog({ onClose }: { onClose: () => void }) {
  const t = useTranslations("ui.keys");
  /* eslint-disable react/jsx-key -- static rows, never reordered */
  const rows: [React.ReactNode, string][] = [
    [<><kbd>Ctrl K</kbd> {t("or")} <kbd>/</kbd></>, t("search")],
    [<kbd>D</kbd>, t("diagram")],
    [<kbd>F</kbd>, t("full")],
    [<kbd>T</kbd>, t("theme")],
    [<kbd>Space</kbd>, t("space")],
    [<><kbd>&larr;</kbd> <kbd>&rarr;</kbd></>, t("arrows")],
    [<kbd>R</kbd>, t("reset")],
    [<><kbd>1</kbd> <kbd>2</kbd></>, t("views")],
    [<kbd>?</kbd>, t("help")],
    [<kbd>Esc</kbd>, t("close")],
  ];
  /* eslint-enable react/jsx-key */
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dlg" role="dialog" aria-label={t("title")}>
        <h3 className="ph">{t("title")}</h3>
        <div className="keys">
          {rows.map(([k, v], i) => (
            <span key={i} style={{ display: "contents" }}>
              <span>{k}</span>
              <span>{v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Chrome({ menu, names }: { menu: MenuGroup[]; names: Record<string, string> }) {
  const t = useTranslations("ui.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const mounted = useMounted();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState<"search" | "keys" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const current = pathname.split("/")[1] || "";
  const dark = mounted && resolvedTheme === "dark";

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const measure = () => document.documentElement.style.setProperty("--tb", el.offsetHeight + "px");
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!(e.target as Element).closest("#topicmenu, #topicsbtn")) setMenuOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const toggleTheme = useCallback(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"), [resolvedTheme, setTheme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      const typing = tg.tagName === "INPUT" || tg.tagName === "TEXTAREA" || tg.tagName === "SELECT";
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen("search");
        return;
      }
      if (e.key === "Escape") {
        setOpen(null);
        setMenuOpen(false);
        return;
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key,
        s = activeExplorer(),
        onBtn = tg.tagName === "BUTTON";
      if (k === "/") {
        e.preventDefault();
        setOpen("search");
      } else if (k === "?") setOpen((o) => (o === "keys" ? null : "keys"));
      else if (k === "d" || k === "D") document.body.classList.toggle("diag");
      else if (k === "f" || k === "F") {
        try {
          if (document.fullscreenElement) document.exitFullscreen();
          else document.documentElement.requestFullscreen().catch(() => {});
        } catch {}
      } else if (k === "t" || k === "T") toggleTheme();
      else if (s && k === " " && !onBtn) {
        e.preventDefault();
        s.toggle();
      } else if (s && k === "ArrowRight") {
        e.preventDefault();
        s.next();
      } else if (s && k === "ArrowLeft") {
        e.preventDefault();
        s.prev();
      } else if (s && (k === "r" || k === "R")) s.reset();
      else if (s && s.predicting() && /^[1-3]$/.test(k)) s.answer(+k - 1);
      else if (s && k === "1") s.setView("nodes");
      else if (s && k === "2") s.setView("seq");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleTheme]);

  return (
    <>
      <header className="nav" ref={navRef}>
        <div className="nav-in">
          <Link className="brand" href="/" aria-label={t("home")}>
            <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M2.5 16c3.5 0 4.2-8 9.5-8s6 8 9.5 8" />
              <circle cx="12" cy="8" r="2.4" fill="currentColor" stroke="none" />
            </svg>
            <span>
              <b>Spring</b> Explorer
            </span>
          </Link>
          <nav className="tabs" aria-label={t("topics")}>
            <button className="topicsbtn" id="topicsbtn" aria-expanded={menuOpen} aria-controls="topicmenu" onClick={() => setMenuOpen((o) => !o)}>
              <span>{names[current] ?? t("topics")}</span>
              <Icon name="chev" />
            </button>
            <div className="topicmenu" id="topicmenu" hidden={!menuOpen}>
              {menu.map((g) => (
                <div className="tm-group" key={g.name}>
                  <h4>{g.name}</h4>
                  {g.items.map((it) => (
                    <Link key={it.id} href={`/${it.id}`} onClick={() => setMenuOpen(false)} aria-current={it.id === current ? "page" : undefined}>
                      <b>{it.name}</b>
                      <small>{it.sub}</small>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </nav>
          <div className="nav-act">
            <button className="iconbtn" aria-label={t("search")} title={t("search")} onClick={() => setOpen("search")}>
              <Icon name="search" />
            </button>
            <button className="iconbtn" aria-label={t("keys")} title={t("keys")} onClick={() => setOpen("keys")}>
              <Icon name="keys" />
            </button>
            <div className="theme" role="group" aria-label={t("theme")}>
              <button aria-pressed={mounted && !dark} aria-label={t("light")} title={t("light")} onClick={() => setTheme("light")}>
                <Icon name="sun" />
              </button>
              <button aria-pressed={dark} aria-label={t("dark")} title={t("dark")} onClick={() => setTheme("dark")}>
                <Icon name="moon" />
              </button>
            </div>
            <div className="theme lang" role="group" aria-label={t("language")}>
              {routing.locales.map((l) => (
                <button key={l} aria-pressed={l === locale} onClick={() => router.replace(pathname, { locale: l })}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>
      {open === "search" && <SearchDialog onClose={() => setOpen(null)} />}
      {open === "keys" && <KeysDialog onClose={() => setOpen(null)} />}
    </>
  );
}
