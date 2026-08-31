import React, { useEffect, useRef, useState } from "react";
import { TaskStatus } from "../lib/api";
import { useApp } from "../lib/store";

/* ================= icons (hand-drawn inline SVG) ================= */

type IconProps = { size?: number; className?: string; strokeWidth?: number };
const base = (p: IconProps) => ({
  width: p.size ?? 16,
  height: p.size ?? 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: p.strokeWidth ?? 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: p.className,
});

export const IconAperture = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v6.5M19.8 7.5l-5.6 3.2M19.8 16.5H13.3M12 21v-6.5M4.2 16.5l5.6-3.2M4.2 7.5h6.5" />
    <polygon points="10.2,9.6 14.6,12 10.2,14.4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconClap = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M3.5 9.5h17v10a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-10Z" />
    <path d="M3.5 9.5 5 4.6l16.2 2.4-1.4 2.5" />
    <path d="m7 5 1.6 3.4M11.5 5.6l1.6 3.3M16 6.3l1.5 3" />
    <polygon points="10.5,12.5 14.8,15 10.5,17.5" fill="currentColor" stroke="none" />
  </svg>
);
export const IconQueue = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 6.5h12M4 12h16M4 17.5h9" />
    <circle cx="19.5" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="17.5" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);
export const IconFilm = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M7.5 4.5v15M16.5 4.5v15M3.5 9h4M3.5 15h4M16.5 9h4M16.5 15h4" />
  </svg>
);
export const IconBrackets = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8 4.5 4 12l4 7.5M16 4.5 20 12l-4 7.5" />
    <path d="M13.2 6.5 10.8 17.5" />
  </svg>
);
export const IconKey = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="8" cy="12" r="4.2" />
    <circle cx="8" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <path d="M12.2 12H20M17.5 12v3M20 12v2.2" />
  </svg>
);
export const IconPlay = (p: IconProps) => (
  <svg {...base(p)}>
    <polygon points="8,5.5 18.5,12 8,18.5" fill="currentColor" stroke="none" />
  </svg>
);
export const IconPause = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="7" y="5.5" width="3.4" height="13" fill="currentColor" stroke="none" />
    <rect x="13.6" y="5.5" width="3.4" height="13" fill="currentColor" stroke="none" />
  </svg>
);
export const IconCopy = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="8.5" y="8.5" width="11" height="11" rx="1.5" />
    <path d="M15.5 8.5v-3a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3" />
  </svg>
);
export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M9.5 6.5v-2h5v2M6.5 6.5l1 13h9l1-13M10 10.5v5.5M14 10.5v5.5" />
  </svg>
);
export const IconRetry = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 12a7.5 7.5 0 1 1 2.2 5.3" />
    <path d="M4.5 21v-4.5H9" />
  </svg>
);
export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4v10.5M7.5 10.5 12 15l4.5-4.5M4.5 19.5h15" />
  </svg>
);
export const IconBolt = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M13 3 5 13.5h5.5L10.5 21 19 10.5h-5.8L13 3Z" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSignal = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 19.5v-3M9 19.5v-6.5M14 19.5V8M19 19.5V4.5" />
  </svg>
);
export const IconGlobe = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c-5.5 5-5.5 12 0 17M12 3.5c5.5 5 5.5 12 0 17" />
  </svg>
);
export const IconChevron = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m8.5 5 7 7-7 7" />
  </svg>
);
export const IconX = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconCheck = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);
export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7v5.2l3.4 2" />
  </svg>
);
export const IconSpark = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.5 13.8 9 19.5 11l-5.7 2L12 18.5 10.2 13 4.5 11l5.7-2L12 3.5Z" fill="currentColor" stroke="none" />
    <path d="M19 3.5v3M20.5 5h-3" />
  </svg>
);

/* ================= status badge ================= */

export function StatusBadge({ status, pulse }: { status: TaskStatus; pulse?: boolean }) {
  const map: Record<TaskStatus, { c: string; dot: string; label: string }> = {
    queued: { c: "text-steel-300 border-steel-500/40 bg-steel-900/40", dot: "bg-steel-400", label: "queued" },
    running: { c: "text-brass-300 border-brass-500/40 bg-brass-900/40", dot: "bg-brass-400", label: "running" },
    succeeded: { c: "text-jade-300 border-jade-500/40 bg-jade-900/40", dot: "bg-jade-400", label: "succeeded" },
    failed: { c: "text-rec-400 border-rec-500/40 bg-rec-900/40", dot: "bg-rec-600", label: "failed" },
  };
  const m = map[status];
  const active = pulse && (status === "queued" || status === "running");
  return (
    <span className={`inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[10px] uppercase tracking-[0.14em] ${m.c}`}>
      <span className="relative flex h-1.5 w-1.5">
        {active && <span className={`soft-ping absolute inline-flex h-full w-full rounded-full ${m.dot}`} />}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${m.dot}`} />
      </span>
      {m.label}
    </span>
  );
}

/* ================= code block with light highlighting ================= */

function highlightJson(src: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false)\b|\b(-?\d+(?:\.\d+)?)\b/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push(<span key={k++} className="tok-punc">{src.slice(last, m.index)}</span>);
    if (m[3] !== undefined) out.push(<span key={k++} className="tok-bool">{m[3]}</span>);
    else if (m[4] !== undefined) out.push(<span key={k++} className="tok-num">{m[4]}</span>);
    else if (m[1]) {
      out.push(
        <span key={k++} className={m[2] ? "tok-key" : "tok-str"}>
          {m[1]}
        </span>
      );
      if (m[2]) out.push(<span key={k++} className="tok-punc">{m[2]}</span>);
    }
    last = re.lastIndex;
  }
  if (last < src.length) out.push(<span key={k++} className="tok-punc">{src.slice(last)}</span>);
  return out;
}

function highlightCurl(src: string): React.ReactNode[] {
  return src.split("\n").map((line, i) => {
    const parts: React.ReactNode[] = [];
    if (i === 0 || line.trimStart().startsWith("curl")) {
      const idx = line.indexOf("curl");
      parts.push(<span key="pre">{line.slice(0, idx)}</span>);
      parts.push(<span key="cmd" className="tok-cmd">curl</span>);
      let rest = line.slice(idx + 4);
      rest = rest.replace(/(--request POST|--request GET|--url|--header|--data|-X POST|-H|-d)/g, "§$1§");
      rest.split("§").forEach((seg, j) => {
        if (/^(--request (POST|GET)|--url|--header|--data|-X POST|-H|-d)$/.test(seg)) parts.push(<span key={j} className="tok-flag">{seg}</span>);
        else {
          const sm = seg.match(/^'(.*)'$/s);
          if (sm) {
            parts.push(<span key={j} className="tok-punc">'</span>);
            parts.push(<span key={"s" + j} className="tok-str">{sm[1]}</span>);
            parts.push(<span key={"e" + j} className="tok-punc">'</span>);
          } else parts.push(<span key={j}>{seg}</span>);
        }
      });
    } else {
      parts.push(highlightJson(line));
    }
    return (
      <React.Fragment key={i}>
        {parts}
        {"\n"}
      </React.Fragment>
    );
  });
}

export function CodeBlock({ code, lang, label }: { code: string; lang: "json" | "curl"; label?: string }) {
  const { toast } = useApp();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast("ok", label ? `${label} copied to clipboard` : "Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("err", "Clipboard unavailable in this browser");
    }
  };
  return (
    <div className="group relative border border-line-soft bg-ink-950/80">
      <div className="flex items-center justify-between border-b border-line-soft px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">{label ?? lang}</span>
        <button
          onClick={copy}
          className="btn-press inline-flex items-center gap-1.5 border border-line-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mut hover:border-brass-500/50 hover:text-brass-300"
        >
          {copied ? <IconCheck size={11} className="text-jade-400" /> : <IconCopy size={11} />}
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre className="code-block max-h-72 overflow-auto whitespace-pre p-3.5 text-paper/90">
        {lang === "json" ? highlightJson(code) : highlightCurl(code)}
      </pre>
    </div>
  );
}

/* ================= scroll reveal ================= */

export function Reveal({ children, className, delay }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            el.classList.add("in");
            io.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className ?? ""}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* ================= section heading ================= */

export function SectionHead({ index, title, note }: { index: string; title: string; note: string }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="font-mono text-[11px] tracking-[0.22em] text-brass-500">/{index}</span>
          <span className="h-px w-14 bg-line" />
          <span className="panel-title">{note}</span>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-paper sm:text-3xl">{title}</h2>
      </div>
      <span className="hidden h-8 w-8 items-center justify-center border border-line-soft text-dim sm:flex">
        <IconAperture size={16} className="spin-slow" />
      </span>
    </Reveal>
  );
}

/* ================= toasts ================= */

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="pointer-events-none fixed bottom-12 right-4 z-[70] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ticker-in pointer-events-auto flex items-start gap-2.5 border px-3.5 py-3 text-[13px] shadow-2xl backdrop-blur-sm ${
            t.kind === "ok"
              ? "border-jade-500/40 bg-jade-900/90 text-jade-300"
              : t.kind === "warn"
                ? "border-brass-500/40 bg-brass-900/90 text-brass-300"
                : "border-rec-500/40 bg-rec-900/90 text-rec-400"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {t.kind === "ok" ? <IconCheck size={13} /> : t.kind === "warn" ? <IconBolt size={13} /> : <IconX size={13} />}
          </span>
          <span className="flex-1 leading-snug text-paper/90">{t.msg}</span>
          <button onClick={() => dismissToast(t.id)} className="shrink-0 text-dim transition-colors hover:text-paper">
            <IconX size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ================= misc ================= */

export function CopyChip({ text, short }: { text: string; short: string }) {
  const { toast } = useApp();
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          toast("ok", `${short} copied`);
        } catch {
          toast("err", "Clipboard unavailable");
        }
      }}
      className="btn-press group inline-flex max-w-full items-center gap-1.5 border border-line-soft bg-ink-950/60 px-2 py-1 font-mono text-[10.5px] text-mut hover:border-steel-500/50 hover:text-steel-300"
      title={text}
    >
      <span className="truncate">{short}</span>
      <IconCopy size={10} className="shrink-0 opacity-60 group-hover:opacity-100" />
    </button>
  );
}
