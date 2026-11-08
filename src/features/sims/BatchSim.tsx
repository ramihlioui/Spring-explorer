"use client";
import { useEffect, useReducer, useState } from "react";
import { useTranslations } from "next-intl";
import { setBatchSize } from "@/features/sims/batchStore";

type Rec = [number, string, string];
type Ev =
  | { t: "read"; i: number }
  | { t: "process"; i: number; filtered: boolean }
  | { t: "write"; items: number[]; upTo: number }
  | { t: "fail"; i: number }
  | { t: "end"; status: "COMPLETED" | "FAILED" };
type RecState = "new" | "reading" | "buffered" | "filtered" | "committed" | "failed" | "rolledback";
interface Note {
  k: string;
  v: Record<string, string | number>;
}
interface B {
  recs: RecState[];
  chunkIdx: number[];
  committed: number[];
  counts: { read: number; filter: number; write: number; commit: number; rollback: number };
  status: string;
  exec: number;
  events: Ev[];
  ptr: number;
  note: Note;
  cur: number;
  last: number;
  size: number;
  corrupt: boolean;
}
const zero = () => ({ read: 0, filter: 0, write: 0, commit: 0, rollback: 0 });

function build(R: Rec[], start: number, size: number, failAt7: boolean) {
  const ev: Ev[] = [];
  let buf: number[] = [],
    inChunk = 0;
  for (let i = start; i < R.length; i++) {
    ev.push({ t: "read", i });
    inChunk++;
    if (failAt7 && R[i][0] === 7) {
      ev.push({ t: "fail", i });
      ev.push({ t: "end", status: "FAILED" });
      return ev;
    }
    const filtered = !R[i][2];
    ev.push({ t: "process", i, filtered });
    if (!filtered) buf.push(i);
    if (inChunk === size || i === R.length - 1) {
      ev.push({ t: "write", items: buf.slice(), upTo: i });
      buf = [];
      inChunk = 0;
    }
  }
  ev.push({ t: "end", status: "COMPLETED" });
  return ev;
}

function fresh(R: Rec[], size: number, corrupt: boolean): B {
  return {
    recs: R.map(() => "new"),
    chunkIdx: [],
    committed: [],
    counts: zero(),
    status: "READY",
    exec: 1,
    events: build(R, 0, size, corrupt),
    ptr: 0,
    note: { k: "start", v: {} },
    cur: -1,
    last: -1,
    size,
    corrupt,
  };
}

type Action = { type: "step" } | { type: "reset"; size?: number; corrupt?: boolean } | { type: "restart" };

function makeReducer(R: Rec[]) {
  return (s: B, a: Action): B => {
    if (a.type === "reset") return fresh(R, a.size ?? s.size, a.corrupt ?? s.corrupt);
    if (a.type === "restart") {
      const n: B = {
        ...s,
        exec: s.exec + 1,
        recs: s.recs.map((x) => (x === "failed" || x === "rolledback" ? "new" : x)),
        counts: zero(),
        chunkIdx: [],
        status: "RUNNING",
        cur: -1,
        events: build(R, s.last + 1, s.size, false),
        ptr: 0,
        note: { k: "restart", v: { n: s.last >= 0 ? R[s.last][0] : 0 } },
      };
      return n;
    }
    if (s.ptr >= s.events.length) return s;
    const e = s.events[s.ptr];
    const n: B = { ...s, ptr: s.ptr + 1, recs: [...s.recs], counts: { ...s.counts }, chunkIdx: [...s.chunkIdx], committed: [...s.committed] };
    if (e.t === "read") {
      n.recs[e.i] = "reading";
      n.counts.read++;
      n.chunkIdx.push(e.i);
      n.cur = e.i;
      n.status = "RUNNING";
      n.note = { k: "read", v: { n: R[e.i][0], name: R[e.i][1] } };
    } else if (e.t === "process") {
      if (e.filtered) {
        n.recs[e.i] = "filtered";
        n.counts.filter++;
        n.note = { k: "filtered", v: { n: R[e.i][0] } };
      } else {
        n.recs[e.i] = "buffered";
        n.note = { k: "processed", v: { n: R[e.i][0], read: n.chunkIdx.length, size: s.size } };
      }
    } else if (e.t === "write") {
      e.items.forEach((i) => {
        n.recs[i] = "committed";
        n.committed.push(i);
      });
      n.counts.write += e.items.length;
      n.counts.commit++;
      n.last = e.upTo;
      n.chunkIdx = [];
      n.note = { k: "written", v: { count: e.items.length, last: R[e.upTo][0] } };
    } else if (e.t === "fail") {
      const lost = n.chunkIdx.filter((i) => i !== e.i).map((i) => R[i][0]);
      n.chunkIdx.forEach((i) => (n.recs[i] = "rolledback"));
      n.recs[e.i] = "failed";
      n.counts.rollback++;
      n.chunkIdx = [];
      n.status = "FAILED";
      n.note = { k: lost.length ? "failedLost" : "failed", v: { n: R[e.i][0], lost: lost.join(", ") } };
    } else {
      n.status = e.status;
      if (e.status === "COMPLETED") n.note = { k: "completed", v: { rows: n.committed.length, filtered: n.counts.filter } };
    }
    return n;
  };
}

export default function BatchSim({ recs }: { recs: Rec[] }) {
  const t = useTranslations("ui.batch");
  const [b, dispatch] = useReducer(makeReducer(recs), undefined, () => fresh(recs, 3, true));
  const [playing, setPlaying] = useState(false);
  const done = b.ptr >= b.events.length;
  const running = playing && !done;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => dispatch({ type: "step" }), 620);
    return () => clearInterval(id);
  }, [running]);

  const c = b.counts;
  const n = b.size;
  useEffect(() => setBatchSize(n), [n]);
  const stateLabel: Record<RecState, string> = {
    new: t("sWaiting"),
    reading: t("sReading"),
    buffered: t("sBuffered"),
    filtered: t("sFiltered"),
    committed: t("sCommitted"),
    failed: t("sFailed"),
    rolledback: t("sRolledBack"),
  };
  const tag = b.status === "COMPLETED" ? "ok" : b.status === "FAILED" ? "bad" : b.status === "RUNNING" ? "warn" : "";
  const reset = (o: { size?: number; corrupt?: boolean } = {}) => {
    setPlaying(false);
    dispatch({ type: "reset", ...o });
  };
  return (
    <div className="panel">
      <div className="ctl" style={{ gap: 16 }}>
        <label className="range" htmlFor="chunk">
          {t("chunkSize")}{" "}
          <input type="range" id="chunk" min={1} max={5} value={n} onChange={(e) => reset({ size: +e.target.value })} />{" "}
          <b className="mono">{n}</b>
        </label>
        <label className="chk" htmlFor="corrupt">
          <input type="checkbox" id="corrupt" checked={b.corrupt} onChange={(e) => reset({ corrupt: e.target.checked })} /> {t("corrupt")}
        </label>
      </div>
      <div className="ctl" style={{ marginTop: 12 }}>
        <button className="btn primary" disabled={done} onClick={() => dispatch({ type: "step" })}>
          {t("step")}
        </button>
        <button className="btn" disabled={done} onClick={() => setPlaying((p) => !p)}>
          {running ? t("pause") : t("play")}
        </button>
        {b.status === "FAILED" && (
          <button
            className="btn"
            onClick={() => {
              setPlaying(false);
              dispatch({ type: "restart" });
            }}
          >
            {t("restart")}
          </button>
        )}
        <button className="btn" onClick={() => reset()}>
          {t("reset")}
        </button>
        <span className={`tag ${tag}`}>{b.status}</span>
        <span className="note">{b.exec > 1 ? t("execution", { n: b.exec, last: recs[b.last][0] }) : ""}</span>
      </div>
      <div className="narr">{t(`note.${b.note.k}`, b.note.v)}</div>
      <div className="cols" style={{ marginTop: 14 }}>
        <div className="tbl-wrap" style={{ marginTop: 0 }}>
          <table className="recs">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("name")}</th>
                <th>Email</th>
                <th>{t("state")}</th>
              </tr>
            </thead>
            <tbody>
              {recs.map((r, i) => (
                <tr key={r[0]} className={b.cur === i && b.status === "RUNNING" ? "cur" : ""}>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>{r[2] || <i className="note">{t("blank")}</i>}</td>
                  <td>
                    <span className={`chip ${b.recs[i]}`}>{stateLabel[b.recs[i]]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="code-label">{t("metaTitle")}</div>
          <div className="meta">
            {(
              [
                ["READ_COUNT", c.read],
                ["FILTER_COUNT", c.filter],
                ["WRITE_COUNT", c.write],
                ["COMMIT_COUNT", c.commit],
                ["ROLLBACK_COUNT", c.rollback],
                ["EXECUTION", "#" + b.exec],
              ] as [string, string | number][]
            ).map(([k, v]) => (
              <div key={k}>
                <small>{k}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className="code-label" style={{ marginTop: 16 }}>
            {t("tableTitle")}
          </div>
          <div className="payload" style={{ marginTop: 0 }}>
            {b.committed.length ? b.committed.map((i) => `${recs[i][0]}  ${recs[i][1]}`).join("\n") : t("empty")}
          </div>
        </div>
      </div>
    </div>
  );
}
