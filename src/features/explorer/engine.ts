/* The step-by-step explorer: isometric node view, sequence view, predict mode, "what if" switch.
   It is an imperative widget (it owns its DOM) because the SVG is re-drawn on every step and nodes
   are dragged with the pointer. React mounts and unmounts it; all text arrives already translated. */
import { codeHTML, esc, fmt, h32 } from "@/lib/code";
import type { ExplorerCfg, ExplorerUi, Scenario, Step } from "@/features/explorer/types";

const ICON = (n: string) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const kindOf = (s: Step) =>
  s.kind === "bad" ? "bad" : s.kind === "ok" ? "ok" : s.ret ? "ret" : s.f === s.t ? "self" : "call";
const firstSentence = (t = "") => {
  const m = t.match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : t;
};

const AH = ["n", "cur", "ok", "bad"]
  .map(
    (k) =>
      `<marker id="@@-${k}" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="8" markerHeight="8" orient="auto-start-reverse"><path class="ah-${k}" d="M1 1L6.5 4L1 7" fill="none"/></marker>`,
  )
  .join("");

/** One isometric block in the Hairline style: three plates, hairline strokes, label on the top face. */
export function isoBlock(cx: number, cy: number, label: string, o: { a?: number; d?: number; cyl?: boolean } = {}) {
  const a = o.a || 70,
    b = Math.round(a * 0.42),
    d = o.d || 16,
    fs = label.length > 15 ? 11.5 : 13;
  const shape = o.cyl
    ? `<path class="s" d="M${cx - a * 0.78} ${cy} v${d + 12} a${a * 0.78} ${b * 0.8} 0 0 0 ${a * 1.56} 0 v${-(d + 12)}"/><ellipse class="t" cx="${cx}" cy="${cy}" rx="${a * 0.78}" ry="${b * 0.8}"/>`
    : `<polygon class="l" points="${cx - a},${cy} ${cx},${cy + b} ${cx},${cy + b + d} ${cx - a},${cy + d}"/><polygon class="r" points="${cx},${cy + b} ${cx + a},${cy} ${cx + a},${cy + d} ${cx},${cy + b + d}"/><polygon class="t" points="${cx},${cy - b} ${cx + a},${cy} ${cx},${cy + b} ${cx - a},${cy}"/>`;
  return `<g class="blk"><g class="shk">${shape}<text class="nm" x="${cx}" y="${cy + 4}" text-anchor="middle" style="font-size:${fs}px">${esc(label)}</text></g></g>`;
}

export function animatePacket(path: SVGPathElement | null, dot: SVGElement | null, ms: number) {
  if (!path || !dot) return;
  const len = path.getTotalLength();
  const put = (t: number) => {
    const p = path.getPointAtLength(len * t);
    dot.setAttribute("cx", String(p.x));
    dot.setAttribute("cy", String(p.y));
  };
  if (!ms || REDUCED()) {
    put(1);
    return;
  }
  const t0 = performance.now();
  (function f(now: number) {
    const t = Math.min(1, Math.max(0, (now - t0) / ms));
    put(t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    if (t < 1) requestAnimationFrame(f);
  })(t0);
}

export interface ExplorerApi {
  root: HTMLElement;
  set(k: string, keep?: boolean): void;
  stop(): void;
  toggle(): void;
  next(): void;
  prev(): void;
  reset(): void;
  setView(v: "nodes" | "seq"): void;
  predicting(): boolean;
  answer(i: number): void;
  refresh(): void;
  key(): string;
  destroy(): void;
}

export interface ExplorerOpts {
  onActive?: (api: ExplorerApi) => void;
  onScenario?: (key: string) => void;
  startKey?: string;
  startStep?: number;
  onStep?: (key: string, step: number) => void;
}

export function createExplorer(
  root: HTMLElement,
  rootId: string,
  cfg: ExplorerCfg,
  ui: ExplorerUi,
  opts: ExplorerOpts = {},
): ExplorerApi {
  const keys = Object.keys(cfg.scenarios);
  let key = opts.startKey && cfg.scenarios[opts.startKey] ? opts.startKey : keys[0];
  let cur = Math.max(0, opts.startStep ?? 0),
    timer: ReturnType<typeof setInterval> | null = null,
    view: "nodes" | "seq" = "nodes",
    selNode: number | null = null,
    userStopped = false,
    swapT: ReturnType<typeof setTimeout> | undefined;
  let drag: { l: number; svg: SVGSVGElement; sx: number; sy: number; moved: boolean } | null = null;
  let predict = false,
    pq: { opts: string[]; correct: number; done: boolean; chosen: number } | null = null,
    score = { ok: 0, n: 0 },
    viewFile: string | null = null;
  const POS: Record<string, Record<string, { x: number; y: number }>> = {};
  const U = (k: string, v?: Record<string, string | number>) => (v ? fmt(ui[k] ?? k, v) : (ui[k] ?? k));

  root.classList.add("seq");
  if (cfg.compact) root.classList.add("compact");
  root.innerHTML = `<div class="xp">
     <div class="xp-main pnl">
       <div class="xp-top">
         <div class="tabs2" role="tablist" aria-label="${esc(U("diagramView"))}"><button role="tab" data-v="nodes" aria-selected="true">${esc(U("nodes"))}</button><button role="tab" data-v="seq" aria-selected="false">${esc(U("sequence"))}</button></div>
         ${cfg.selector === false ? "" : `<div class="seq-sel" role="group" aria-label="${esc(U("trail"))}"></div>`}
         <div class="xp-tools">
           <button class="pill" data-a="break" hidden></button>
           <button class="pill" data-a="predict" aria-pressed="false" title="${esc(U("predictHint"))}">${ICON("target")}<span>${esc(U("predict"))}</span></button>
         </div>
       </div>
       <div class="seq-svgwrap graph" data-r="graph"></div>
       <div class="seq-svgwrap" data-r="fig" hidden></div>
       <div class="node-info" data-r="node"></div>
       <div class="playbar">
         <button class="iconbtn" data-a="back" aria-label="${esc(U("prevStep"))}" title="${esc(U("prevHint"))}">${ICON("prev")}</button>
         <button class="btn primary" data-a="play" title="${esc(U("playHint"))}">${ICON("play")}<span>${esc(U("play"))}</span></button>
         <button class="iconbtn" data-a="next" aria-label="${esc(U("nextStep"))}" title="${esc(U("nextHint"))}">${ICON("next")}</button>
         <div class="vine" data-r="vine" role="group" aria-label="${esc(U("steps"))}"></div>
         <span class="count" data-r="count"></span>
         <select id="${rootId}-spd" aria-label="${esc(U("speed"))}"><option value="0.5">0.5x</option><option value="1" selected>1x</option><option value="2">2x</option></select>
         <button class="iconbtn" data-a="link" aria-label="${esc(U("copyLink"))}" title="${esc(U("copyLink"))}">${ICON("copy")}</button>
         <button class="iconbtn" data-a="reset" aria-label="${esc(U("reset"))}" title="${esc(U("resetHint"))}">${ICON("reset")}</button>
       </div>
     </div>
     <aside class="xp-over pnl"><div class="over" data-r="over" aria-live="polite"></div></aside>
   </div>
   <section class="trailcard">
     <h3 class="sh">${esc(U("steps"))}</h3>
     <ol class="trail" data-r="tbl"></ol>
   </section>
   <div class="xp-lower"><div data-r="state"></div><div><div class="filetabs" data-r="files" hidden></div><div class="codebox"><div class="code" data-r="code"></div><button class="copy" type="button" aria-label="${esc(U("copyCode"))}">${ICON("copy")}</button></div></div></div>`;

  const q = <T extends Element = HTMLElement>(s: string) => root.querySelector(s) as T;
  const sc = (): Scenario => cfg.scenarios[key];
  const speed = () => +q<HTMLSelectElement>("#" + rootId + "-spd").value;
  const last = () => sc().steps.length - 1;
  cur = Math.min(cur, last());
  const setPlay = (on: boolean) => {
    q("[data-a=play]").innerHTML = ICON(on ? "pause" : "play") + `<span>${esc(on ? U("pause") : U("play"))}</span>`;
  };
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    setPlay(false);
  }
  function derive() {
    const S = sc(),
      txs: Record<string, string> = {},
      rows: [string, string][] = [],
      list: string[] = [],
      badges: Record<string, string> = {},
      calls: Record<string, number> = {};
    let lastTx: string | null = null;
    for (let i = 0; i <= cur; i++) {
      const s = S.steps[i];
      if (s.set) {
        Object.assign(txs, s.set);
        lastTx = Object.keys(s.set).pop() ?? null;
      }
      if (s.row) rows.push([s.row, s.tx || "tx-1"]);
      if (s.add) list.push(s.add);
      if (s.badge) Object.assign(badges, s.badge);
      calls[s.t] = (calls[s.t] || 0) + 1;
    }
    return { txs, rows, list, badges, calls, lastTx };
  }

  /* ----- predict mode ----- */
  const stepLabel = (s: Step) => (s.f === s.t ? `${s.f}: ${s.label}` : `${s.f} → ${s.t}: ${s.label}`);
  function mkQuestion() {
    const S = sc(),
      next = S.steps[cur + 1],
      correct = stepLabel(next);
    const pool = [...new Set(S.steps.map(stepLabel))]
      .filter((l) => l !== correct && l !== stepLabel(S.steps[cur]))
      .sort((a, b) => h32(a + cur) - h32(b + cur));
    const dist = pool.slice(0, 2),
      lanes = S.lanes.filter((l) => l !== next.t);
    while (dist.length < 2 && lanes.length) {
      const fake = `${next.f} → ${lanes.shift()}: ${next.label}`;
      if (fake !== correct && !dist.includes(fake)) dist.push(fake);
    }
    const o = [correct, ...dist].sort((a, b) => h32(a + "#" + cur) - h32(b + "#" + cur));
    return { opts: o, correct: o.indexOf(correct), done: false, chosen: -1 };
  }
  const askIfNeeded = () => {
    pq = predict && cur < last() ? mkQuestion() : null;
  };
  function pqHTML() {
    if (!predict) return "";
    if (cur >= last()) return `<div class="pq"><p class="pq-done">${esc(U("predictEnd", { ok: score.ok, n: score.n }))}</p></div>`;
    if (!pq) return "";
    const next = sc().steps[cur + 1],
      good = pq.chosen === pq.correct;
    return (
      `<div class="pq"><h4>${esc(U("whatNext"))}</h4><div class="pq-opts">` +
      pq.opts
        .map(
          (o, i) =>
            `<button data-p="${i}" class="${pq!.done ? (i === pq!.correct ? "right" : i === pq!.chosen ? "wrong" : "") : ""}" ${pq!.done ? "disabled" : ""}><span>${i + 1}</span>${esc(o)}</button>`,
        )
        .join("") +
      "</div>" +
      (pq.done
        ? `<p class="pq-why"><b>${esc(good ? U("correct") : U("notQuite"))}</b><span>${esc(next.note || "")}</span></p><button class="btn primary" data-a="pcont">${esc(U("continue"))}</button>`
        : "") +
      "</div>"
    );
  }

  /* ----- nodes view ----- */
  function geom() {
    const S = sc(),
      n = S.lanes.length,
      W = 760,
      two = n > 3,
      H = two ? 350 : 220,
      per = two ? Math.ceil(n / 2) : n,
      a = 70,
      b = Math.round(a * 0.42),
      d = 16;
    const pos = S.lanes.map((l, i) => {
      const o = POS[key] && POS[key][l];
      if (o) return o;
      if (!two) return { x: (W * (i + 0.5)) / n, y: 118 };
      if (i < per) return { x: (W * (i + 0.5)) / per, y: 104 };
      return { x: (W * (per - 1 - (i - per) + 0.5)) / per, y: 250 };
    });
    return { S, n, W, H, a, b, d, pos };
  }
  type G = ReturnType<typeof geom>;
  let focusX = 0.5;
  function edge(g: G, ia: number, ib: number) {
    const A = g.pos[ia],
      B = g.pos[ib],
      cyA = A.y + g.d / 2,
      cyB = B.y + g.d / 2;
    if (ia === ib) {
      const x = A.x,
        y = A.y - g.b;
      return { d: `M${x - 14} ${y - 2} C${x - 34} ${y - 48} ${x + 34} ${y - 48} ${x + 14} ${y - 2}`, lx: x, ly: y - 44, sx: x - 14, sy: y - 2 };
    }
    const dx = B.x - A.x,
      dy = cyB - cyA,
      dist = Math.hypot(dx, dy) || 1;
    const s = Math.min((g.a + 8) / (Math.abs(dx) || 1e-9), (g.b + g.d / 2 + 8) / (Math.abs(dy) || 1e-9), 0.45);
    const sx = A.x + dx * s,
      sy = cyA + dy * s,
      ex = B.x - dx * s,
      ey = cyB - dy * s,
      off = g.n <= 3 && Math.abs(ia - ib) > 1 ? 80 : Math.min(34, dist * 0.16);
    const cx = (sx + ex) / 2 - (dy / dist) * off,
      cy = (sy + ey) / 2 + (dx / dist) * off;
    return { d: `M${sx} ${sy} Q${cx} ${cy} ${ex} ${ey}`, lx: 0.25 * sx + 0.5 * cx + 0.25 * ex, ly: 0.25 * sy + 0.5 * cy + 0.25 * ey, sx, sy };
  }
  function graphHTML() {
    const g = geom(),
      { S, W, H } = g,
      d = derive(),
      st = S.steps[cur];
    const fi = S.lanes.indexOf(st.f),
      ti = S.lanes.indexOf(st.t);
    let h = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(U("nodesIn", { label: S.label, lanes: S.lanes.join(", ") }))}"><defs>${AH.split("@@").join(rootId + "-g")}</defs>`;
    const seen: Record<string, number> = {};
    S.steps.slice(0, cur).forEach((s) => {
      const k = s.f + ">" + s.t;
      seen[k] = (seen[k] || 0) + 1;
    });
    Object.entries(seen).forEach(([k, c]) => {
      const [a, b] = k.split(">"),
        e = edge(g, S.lanes.indexOf(a), S.lanes.indexOf(b));
      h += `<path class="ge" d="${e.d}" marker-end="url(#${rootId}-g-n)"/>` + (c > 1 ? `<text class="cnt" x="${e.lx}" y="${e.ly - 6}" text-anchor="middle">${c}x</text>` : "");
    });
    const ce = edge(g, fi, ti);
    focusX = ce.lx / W;
    const mk = st.kind === "bad" ? "bad" : st.kind === "ok" ? "ok" : "cur";
    h += `<path id="${rootId}-cp" class="ge cur ${st.kind || ""} ${st.ret ? "ret" : ""}" d="${ce.d}" marker-end="url(#${rootId}-g-${mk})"/>`;
    S.lanes.forEach((l, i) => {
      const p = g.pos[i],
        cyl = /database/i.test(l);
      const txLabel = (v: string) => ui["tx_" + v] ?? v;
      let bd =
        d.badges[l] ||
        (cyl && d.lastTx ? (d.lastTx === "autocommit" ? U("autocommit") : d.lastTx + ": " + txLabel(d.txs[d.lastTx])) : "") ||
        (d.calls[l] ? U(d.calls[l] === 1 ? "callOne" : "callMany", { n: d.calls[l] }) : "");
      if (bd.length > 24) bd = bd.slice(0, 23) + "…";
      const on = i === fi || i === ti,
        tgt = i === ti;
      h += `<g class="gn ${on ? "on" : ""} ${tgt ? "tgt " + (st.kind || "") : ""} ${selNode === i ? "sel" : ""}" data-l="${i}" style="--i:${i}" tabindex="0" role="button" aria-label="${esc(l)}">${isoBlock(p.x, p.y, l, { a: g.a, cyl })}<text class="bd" x="${p.x}" y="${p.y + g.b + g.d + 18}" text-anchor="middle">${esc(bd)}</text></g>`;
    });
    const horiz = fi !== ti && Math.abs(g.pos[fi].y - g.pos[ti].y) < 4 && Math.abs(g.pos[fi].x - g.pos[ti].x) < 300;
    h += `<text class="glab" x="${ce.lx}" y="${horiz ? g.pos[fi].y - g.b - 22 : ce.ly - 10}" text-anchor="middle">${esc(st.label)}</text><circle id="${rootId}-dot" class="pk ${st.kind || ""}" r="4.5" cx="${ce.sx}" cy="${ce.sy}"/>`;
    return h + "</svg>";
  }
  function renderGraph(still: boolean) {
    const wrap = q("[data-r=graph]");
    wrap.innerHTML = graphHTML();
    if (wrap.scrollWidth > wrap.clientWidth + 1) {
      const svg = wrap.querySelector("svg")!;
      wrap.scrollTo({ left: Math.max(0, focusX * svg.clientWidth - wrap.clientWidth / 2), behavior: still || REDUCED() ? "auto" : "smooth" });
    }
    animatePacket(q<SVGPathElement>("#" + rootId + "-cp"), q<SVGElement>("#" + rootId + "-dot"), still ? 0 : 900);
    const up = () => q("[data-r=graph]").querySelectorAll(".gn.tgt").forEach((n) => n.classList.add("up"));
    if (still || REDUCED()) up();
    else requestAnimationFrame(() => requestAnimationFrame(up));
  }
  function nodeInfo() {
    const S = sc(),
      el = q("[data-r=node]");
    if (selNode == null) {
      el.innerHTML = "";
      return;
    }
    const l = S.lanes[selNode];
    el.innerHTML =
      `<div class="ni"><b>${esc(l)}</b><span>${esc((S.info && S.info[l]) || cfg.laneInfo[l] || "")}</span></div><div class="chips">` +
      S.steps
        .map((s, i) => [s, i] as const)
        .filter(([s]) => s.f === l || s.t === l)
        .map(([s, i]) => `<button class="chipb ${i === cur ? "on" : ""}" data-jump="${i}">${i + 1}. ${esc(s.label)}</button>`)
        .join("") +
      "</div>";
  }

  /* ----- sequence view ----- */
  function seqHTML() {
    const S = sc(),
      n = S.lanes.length,
      W = 760,
      colW = W / n,
      x = (i: number) => colW * (i + 0.5),
      top = 52,
      rh = 48,
      H = top + S.steps.length * rh + 16;
    const idx = (nm: string) => S.lanes.indexOf(nm),
      st = S.steps[cur],
      act = [idx(st.f), idx(st.t)];
    let h = `<svg style="min-width:${Math.max(580, n * 110)}px" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(U("seqIn", { label: S.label, lanes: S.lanes.join(", ") }))}"><defs>${AH.split("@@").join(rootId)}</defs>`;
    S.lanes.forEach((l, i) => {
      h += `<line class="life" x1="${x(i)}" y1="34" x2="${x(i)}" y2="${H}"/><g class="lane ${act.includes(i) ? "on" : ""}"><text x="${x(i)}" y="22" text-anchor="middle">${esc(l)}</text><line x1="${x(i) - colW / 2 + 14}" y1="32" x2="${x(i) + colW / 2 - 14}" y2="32"/></g>`;
    });
    S.steps.forEach((s, i) => {
      const a = idx(s.f),
        b = idx(s.t),
        y = top + i * rh + 16,
        isCur = i === cur;
      const mk = s.kind === "bad" ? "bad" : s.kind === "ok" ? "ok" : isCur ? "cur" : "n";
      let d: string,
        lx: number,
        anchor = "middle",
        ly = y - 8;
      if (a === b) {
        const dir = a === n - 1 ? -1 : 1,
          x0 = x(a);
        d = `M${x0} ${y - 10} h${dir * 34} v22 h${-dir * 34}`;
        lx = x0 + dir * 42;
        anchor = dir < 0 ? "end" : "start";
        ly = y + 5;
      } else {
        const x1 = x(a),
          x2 = x(b),
          off = x2 > x1 ? -1 : 1;
        d = `M${x1} ${y} L${x2 + off} ${y}`;
        lx = (x1 + x2) / 2;
      }
      h += `<g class="m ${isCur ? "cur" : i < cur ? "past" : "fut"} ${s.kind || ""}" data-i="${i}" data-f="${a}" data-t="${b}"><rect class="rowbg" x="0" y="${y - 26}" width="${W}" height="${rh}"/><text class="no" x="4" y="${y + 4}">${i + 1}</text><path class="ml ${s.ret ? "ret" : ""}" d="${d}" pathLength="1" fill="none" marker-end="url(#${rootId}-${mk})"/><text class="ml-t" x="${lx}" y="${ly}" text-anchor="${anchor}">${esc(s.label)}</text></g>`;
    });
    return h + "</svg>";
  }
  function overHTML() {
    const S = sc(),
      st = S.steps[cur],
      route =
        st.f === st.t
          ? `<span>${esc(st.f)}</span><span>${esc(U("internal"))}</span>`
          : `<span>${esc(st.f)}</span>${ICON("arrow")}<span>${esc(st.t)}</span>`;
    return (
      `<div class="ov-top"><h3 class="ov-t">${esc(st.label)}</h3></div><div class="ov-route">${route}</div>` +
      `<p class="ov-p">${esc(st.note || "")}</p>` +
      (st.payload ? `<div class="payload">${esc(st.payload)}</div>` : "") +
      pqHTML()
    );
  }
  function tblHTML() {
    return sc()
      .steps.map((s, i) => {
        const k = kindOf(s);
        return `<li class="${i === cur ? "cur" : i < cur ? "past" : "fut"}"><button data-i="${i}"><span class="nb ${k}">${i + 1}</span><span class="tl"><span class="tl-top"><b>${esc(s.label)}</b><span class="tl-route"><span>${esc(s.f)}</span><span>&rarr;</span><span>${esc(s.t)}</span></span></span><span class="tl-info">${esc(firstSentence(s.note || ""))}</span></span></button></li>`;
      })
      .join("");
  }
  function vineHTML() {
    return sc()
      .steps.map(
        (s, i) =>
          `<button class="vn ${i === cur ? "cur" : i < cur ? "done" : "fut"}" data-i="${i}" aria-label="${esc(U("stepN", { n: i + 1, label: s.label }))}" title="${i + 1}. ${esc(s.label)}"></button>`,
      )
      .join("");
  }
  function stateHTML() {
    const S = sc(),
      kind = S.state || "list";
    if (kind === "none") return "";
    const d = derive();
    const txLabel = (v: string) => ui["tx_" + v] ?? v;
    if (kind === "db") {
      const chips =
        Object.entries(d.txs)
          .map(
            ([k, v]) =>
              `<span class="st ${v === "committed" ? "ok" : v === "open" ? "" : "bad"}">${esc(k === "autocommit" ? U("autocommitLong") : k + ": " + txLabel(v))}</span>`,
          )
          .join("") || `<span class="st">${esc(U("noTx"))}</span>`;
      const body = d.rows.length
        ? d.rows
            .map(([t, tx]) => {
              const v = d.txs[tx],
                c = v === "committed" ? "ok" : v === "rolled back" ? "bad" : "",
                lab = c === "" ? U("pending") : c === "bad" ? U("rolledBack") : U("committed");
              return `<div class="srow"><span>${esc(t)}</span><span class="st ${c}">${esc(lab)}</span></div>`;
            })
            .join("")
        : `<div class="note">${esc(U("noRows"))}</div>`;
      return `<div class="seq-state"><h3 class="sh">${esc(U("database"))}</h3><div class="txs">${chips}</div>${body}</div>`;
    }
    return (
      `<div class="seq-state"><h3 class="sh">${esc(S.stateTitle || U("state"))}</h3>` +
      (d.list.length
        ? d.list.map((t, i) => `<div class="srow"><span>${esc(t)}</span>${i === d.list.length - 1 ? `<span class="st ok">${esc(U("new"))}</span>` : ""}</div>`).join("")
        : `<div class="note">${esc(U("nothingYet"))}</div>`) +
      "</div>"
    );
  }
  function render() {
    const S = sc(),
      st = S.steps[cur],
      sel = q(".seq-sel"),
      n = S.steps.length;
    if (sel) {
      sel.innerHTML = keys.map((k) => `<button data-k="${k}" aria-pressed="${k === key}">${esc(cfg.scenarios[k].label)}</button>`).join("");
      sel.querySelectorAll<HTMLButtonElement>("button").forEach((b) => (b.onclick = () => set(b.dataset.k!)));
    }
    const bk = cfg.breakIt && cfg.breakIt[key],
      bb = q("[data-a=break]");
    bb.hidden = !bk;
    if (bk) {
      bb.innerHTML = ICON("zap") + `<span>${esc(bk[1])}</span>`;
      bb.title = U("whatIf", { x: bk[1] });
    }
    const pb = q("[data-a=predict]");
    pb.setAttribute("aria-pressed", String(predict));
    pb.querySelector("span")!.textContent = predict ? U("predictScore", { ok: score.ok, n: score.n }) : U("predict");
    q<HTMLButtonElement>("[data-a=play]").disabled = predict;
    root.classList.toggle("predicting", predict);
    renderGraph(false);
    q("[data-r=fig]").innerHTML = seqHTML();
    nodeInfo();
    q("[data-r=over]").innerHTML = overHTML();
    q("[data-r=count]").textContent = `${cur + 1} / ${n}`;
    const tb = q("[data-r=tbl]");
    tb.innerHTML = tblHTML();
    q("[data-r=vine]").innerHTML = vineHTML();
    const vc = q(".vn.cur");
    if (vc) q("[data-r=vine]").scrollLeft = Math.max(0, vc.offsetLeft - q("[data-r=vine]").clientWidth / 2);
    const row = tb.querySelector<HTMLElement>("li.cur");
    if (row) tb.scrollTop = Math.max(0, row.offsetTop - tb.clientHeight / 2 + row.offsetHeight / 2);
    const sh = stateHTML();
    q("[data-r=state]").innerHTML = sh;
    q(".xp-lower").classList.toggle("one", !sh);
    const files = S.files ? Object.keys(S.files) : null,
      ft = q("[data-r=files]");
    const fname = files ? viewFile || st.file || files[0] : null,
      lines = files && fname ? S.files![fname] : (S.code ?? []);
    if (files) {
      ft.hidden = false;
      ft.innerHTML = files.map((f) => `<button data-file="${esc(f)}" aria-pressed="${f === fname}">${esc(f)}</button>`).join("");
    } else ft.hidden = true;
    const showHi = !files || fname === (st.file || files[0]);
    const c = q("[data-r=code]");
    c.innerHTML = codeHTML(lines, showHi ? st.hi || [] : []);
    c.classList.toggle("dimmed", !!(showHi && st.hi && st.hi.length));
    c.dataset.code = (Array.isArray(lines) ? lines : String(lines).split("\n")).join("\n");
    q<HTMLButtonElement>("[data-a=back]").disabled = cur === 0;
    q<HTMLButtonElement>("[data-a=next]").disabled = cur === n - 1;
    q("[data-r=graph]").hidden = view === "seq";
    q("[data-r=node]").hidden = view === "seq";
    q("[data-r=fig]").hidden = view === "nodes";
    root.querySelectorAll<HTMLElement>("[data-v]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.v === view)));
  }
  function set(k: string, keep?: boolean) {
    key = k;
    cur = keep ? Math.min(cur, last()) : 0;
    selNode = null;
    viewFile = null;
    stop();
    askIfNeeded();
    root.classList.remove("swap");
    void root.offsetWidth;
    root.classList.add("swap");
    clearTimeout(swapT);
    swapT = setTimeout(() => root.classList.remove("swap"), 900);
    render();
    opts.onScenario?.(k);
    opts.onStep?.(key, cur);
  }
  function go(i: number) {
    cur = clamp(i, 0, last());
    viewFile = null;
    askIfNeeded();
    render();
    opts.onStep?.(key, cur);
  }
  const jump = (i: number) => {
    if (predict && i > cur) return;
    userStopped = true;
    stop();
    go(i);
  };
  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (cur >= last()) {
        if (cfg.loop) go(0);
        else stop();
        return;
      }
      go(cur + 1);
      if (cur >= last() && !cfg.loop) stop();
    }, 1700 / speed());
  }
  function toggle() {
    if (predict) return;
    if (timer) {
      userStopped = true;
      stop();
      return;
    }
    userStopped = false;
    if (cur >= last()) cur = 0;
    render();
    setPlay(true);
    startTimer();
  }
  function togglePredict() {
    predict = !predict;
    score = { ok: 0, n: 0 };
    stop();
    askIfNeeded();
    render();
  }
  function answer(i: number) {
    if (!pq || pq.done || i < 0 || i >= pq.opts.length) return;
    pq.done = true;
    pq.chosen = i;
    score.n++;
    if (i === pq.correct) score.ok++;
    render();
  }
  function hlNode(l: number | null) {
    root.querySelectorAll<SVGElement>(".m").forEach((m) => m.classList.toggle("dim", l != null && +m.dataset.f! !== l && +m.dataset.t! !== l));
    root.querySelectorAll<SVGElement>(".gn").forEach((g) => g.classList.toggle("dim", l != null && +g.dataset.l! !== l));
  }
  function hlMsg(i: number | null) {
    const s = i == null ? null : sc().steps[i],
      L = sc().lanes;
    root.querySelectorAll<SVGElement>(".m").forEach((m) => m.classList.toggle("dim", i != null && +m.dataset.i! !== i));
    root.querySelectorAll<SVGElement>(".gn").forEach((g) => g.classList.toggle("dim", i != null && !!s && L[+g.dataset.l!] !== s.f && L[+g.dataset.l!] !== s.t));
  }

  const ac = new AbortController();
  const sig = { signal: ac.signal };
  const on = <K extends keyof HTMLElementEventMap>(t: HTMLElement, ev: K, fn: (e: HTMLElementEventMap[K]) => void, cap?: boolean) =>
    t.addEventListener(ev, fn as EventListener, { signal: ac.signal, capture: cap });

  on(root, "mouseover", (e) => {
    const t = e.target as Element,
      g = t.closest<HTMLElement>(".gn"),
      m = t.closest<HTMLElement>(".m");
    if (drag) return;
    if (g) hlNode(+g.dataset.l!);
    else if (m) hlMsg(+m.dataset.i!);
    else hlNode(null);
  });
  on(root, "mouseleave", () => hlNode(null));
  on(root, "pointerdown", () => opts.onActive?.(api), true);
  on(root, "focusin", () => opts.onActive?.(api));
  on(root, "click", (e) => {
    const t = e.target as Element;
    const a = t.closest<HTMLElement>("[data-a]"),
      v = t.closest<HTMLElement>("[data-v]"),
      j = t.closest<HTMLElement>("[data-jump]"),
      m = t.closest<HTMLElement>(".m"),
      r = t.closest<HTMLElement>(".trail [data-i], .vn[data-i]"),
      p = t.closest<HTMLElement>("[data-p]"),
      fl = t.closest<HTMLElement>("[data-file]");
    if (p) return answer(+p.dataset.p!);
    if (fl) {
      viewFile = fl.dataset.file!;
      render();
      return;
    }
    if (a) {
      const act = a.dataset.a;
      if (act === "back") {
        userStopped = true;
        stop();
        go(cur - 1);
      } else if (act === "next") {
        userStopped = true;
        stop();
        go(cur + 1);
      } else if (act === "reset") {
        userStopped = true;
        stop();
        go(0);
      } else if (act === "play") toggle();
      else if (act === "predict") togglePredict();
      else if (act === "link") {
        const u = new URL(location.href);
        u.searchParams.delete("go");
        u.searchParams.set(rootId, `${key}.${cur}`);
        u.hash = root.closest(".block")?.id ?? "";
        const done = (ok: boolean) => {
          a.innerHTML = ICON(ok ? "check" : "copy");
          a.title = ok ? U("linkCopied") : U("copyLink");
          setTimeout(() => {
            a.innerHTML = ICON("copy");
            a.title = U("copyLink");
          }, 1400);
        };
        navigator.clipboard.writeText(u.toString()).then(() => done(true), () => done(false));
      }
      else if (act === "pcont") go(cur + 1);
      else if (act === "break") {
        const bk = cfg.breakIt && cfg.breakIt[key];
        if (bk) {
          userStopped = true;
          set(bk[0], true);
        }
      }
    } else if (v) {
      view = v.dataset.v as "nodes" | "seq";
      render();
    } else if (j) jump(+j.dataset.jump!);
    else if (r) jump(+r.dataset.i!);
    else if (m) jump(+m.dataset.i!);
  });
  on(root, "input", (e) => {
    if ((e.target as HTMLElement).id === rootId + "-spd" && timer) startTimer();
  });
  on(root, "keydown", (e) => {
    const g = (e.target as Element).closest?.<HTMLElement>(".gn");
    if (g && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      e.stopPropagation();
      selNode = selNode === +g.dataset.l! ? null : +g.dataset.l!;
      render();
    }
  });
  on(root, "pointerdown", (e) => {
    const n = (e.target as Element).closest<SVGGElement>(".gn");
    if (!n || e.button > 0) return;
    drag = { l: +n.dataset.l!, svg: n.ownerSVGElement!, sx: e.clientX, sy: e.clientY, moved: false };
  });
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 4) return;
      drag.moved = true;
      const m = drag.svg.getScreenCTM();
      if (!m) return;
      const pt = drag.svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const p = pt.matrixTransform(m.inverse()),
        g = geom();
      (POS[key] = POS[key] || {})[g.S.lanes[drag.l]] = {
        x: clamp(p.x, g.a + 4, g.W - g.a - 4),
        y: clamp(p.y, g.b + 50, g.H - g.b - g.d - 30),
      };
      renderGraph(true);
      drag.svg = q<SVGSVGElement>("[data-r=graph] svg");
    },
    sig,
  );
  window.addEventListener(
    "pointerup",
    () => {
      if (!drag) return;
      const d = drag;
      drag = null;
      if (!d.moved) {
        selNode = selNode === d.l ? null : d.l;
        render();
      }
    },
    sig,
  );

  render();
  const api: ExplorerApi = {
    root,
    set,
    stop,
    toggle,
    key: () => key,
    refresh: render,
    next() {
      userStopped = true;
      stop();
      go(cur + 1);
    },
    prev() {
      userStopped = true;
      stop();
      go(cur - 1);
    },
    reset() {
      userStopped = true;
      stop();
      go(0);
    },
    setView(v) {
      view = v;
      render();
    },
    predicting: () => !!(predict && pq && !pq.done),
    answer,
    destroy() {
      stop();
      ac.abort();
      io?.disconnect();
      clearTimeout(swapT);
    },
  };
  let io: IntersectionObserver | undefined;
  if (cfg.autoplay && !REDUCED() && "IntersectionObserver" in window) {
    io = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (en.isIntersecting && !timer && !userStopped) {
            setPlay(true);
            startTimer();
          } else if (!en.isIntersecting && timer) stop();
        });
      },
      { threshold: 0.35 },
    );
    io.observe(root);
  }
  return api;
}
