"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";

type Fig = { update(o: { theme?: "light" | "dark" | "auto" }): void; destroy(): void };

/** A live Hairline figure. The library is loaded on demand so it never blocks the first paint. */
export default function HairlineFigure({ name, className = "tfig" }: { name: string; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const fig = useRef<Fig | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const themeRef = useRef(theme);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    themeRef.current = theme;
    fig.current?.update({ theme });
  }, [theme]);
  useEffect(() => {
    let dead = false;
    import("@lucasmarkes/hairline")
      .then((m) => {
        const make = (m as unknown as Record<string, (el: HTMLElement, o: object) => Fig>)[name];
        if (dead || !host.current || typeof make !== "function") {
          if (!dead) setState("failed");
          return;
        }
        host.current.innerHTML = "";
        fig.current = make(host.current, { play: true, theme: themeRef.current });
        setState("ready");
      })
      .catch(() => !dead && setState("failed"));
    return () => {
      dead = true;
      fig.current?.destroy();
      fig.current = null;
    };
  }, [name]);
  return (
    <div className={`${className} ${state === "loading" ? "loading" : ""} ${state === "failed" ? "failed" : ""}`}>
      <div className="tfig-in" ref={host} />
    </div>
  );
}
