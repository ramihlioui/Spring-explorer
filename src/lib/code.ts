export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const HL =
  /(\/\/.*$|#.*$)|("(?:[^"\\]|\\.)*")|(@\w+)|\b(public|private|class|return|new|final|void|import|record|interface|extends|throws|if|else|throw|const|async|await|try|catch|for|while|var)\b/gm;

export const hl = (s: string) =>
  esc(s).replace(HL, (m, c, str, an, kw) =>
    c
      ? `<span class="c">${c}</span>`
      : str
        ? `<span class="s">${str}</span>`
        : an
          ? `<span class="a">${an}</span>`
          : `<span class="k">${kw}</span>`,
  );

export function codeHTML(lines: string | string[], hi: number[] = []) {
  const arr = Array.isArray(lines) ? lines : lines.split("\n");
  return arr
    .map((l, i) => `<span class="ln${hi.includes(i) ? " hi" : ""}">${hl(l) || " "}</span>`)
    .join("");
}

/** FNV-1a: a stable shuffle key, so server and client order options the same way. */
export function h32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const fmt = (s: string, v: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
