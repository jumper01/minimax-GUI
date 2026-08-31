import { useEffect, useState } from "react";
import { Docs } from "./components/Docs";
import { Keys } from "./components/Keys";
import { Library } from "./components/Library";
import { Queue } from "./components/Queue";
import { Studio } from "./components/Studio";
import {
  IconAperture,
  IconBrackets,
  IconClap,
  IconFilm,
  IconKey,
  IconQueue,
  Reveal,
  SectionHead,
  Toasts,
} from "./components/ui";
import { REGION_HOST, Region, fmtClock, maskKey } from "./lib/api";
import { AppProvider, CREDITS_BUDGET, useApp } from "./lib/store";

const NAV = [
  { id: "studio", label: "Studio", icon: IconClap },
  { id: "queue", label: "Queue", icon: IconQueue },
  { id: "library", label: "Library", icon: IconFilm },
  { id: "endpoints", label: "Endpoints", icon: IconBrackets },
  { id: "keys", label: "Keys", icon: IconKey },
];

function Masthead() {
  const app = useApp();
  const activeKey = app.keys.find((k) => k.id === app.activeKeyId);
  const remaining = CREDITS_BUDGET - app.creditsUsed;
  const pct = Math.max(0, Math.min(100, (remaining / CREDITS_BUDGET) * 100));

  return (
    <header className="hairline-b sticky top-0 z-50 border-b border-line-soft bg-ink-900/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
        {/* brand */}
        <a href="#studio" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center border border-brass-500/50 bg-brass-900/30 text-brass-400 transition-all group-hover:rotate-45 group-hover:border-brass-400">
            <IconAperture size={17} />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[13px] font-bold tracking-tight text-paper">
              MOTION<span className="text-brass-400">/</span>CONSOLE
            </span>
            <span className="mt-0.5 block font-mono text-[8.5px] uppercase tracking-[0.28em] text-dim">minimax video api</span>
          </span>
        </a>

        <div className="ml-auto flex items-center gap-3 sm:gap-5">
          {/* region toggle */}
          <div className="flex border border-line-soft bg-ink-950/60 p-0.5">
            {(["intl", "cn"] as Region[]).map((r) => (
              <button
                key={r}
                onClick={() => app.setRegion(r)}
                className={`btn-press px-2.5 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] transition-colors ${
                  app.region === r ? "bg-steel-900 text-steel-300" : "text-dim hover:text-paper"
                }`}
                title={REGION_HOST[r]}
              >
                {r}
              </button>
            ))}
          </div>

          {/* key status */}
          <a href="#keys" className="group hidden items-center gap-2 font-mono text-[10.5px] text-mut transition-colors hover:text-brass-300 sm:flex">
            <IconKey size={13} className={activeKey ? "text-jade-400" : "text-rec-500"} />
            <span className="max-w-[140px] truncate">{activeKey ? maskKey(activeKey.key) : "no key"}</span>
          </a>

          {/* credits */}
          <div className="hidden w-36 md:block" title={`${remaining} credits remaining`}>
            <div className="mb-1 flex justify-between font-mono text-[9px] uppercase tracking-[0.16em] text-dim">
              <span>credits</span>
              <span className={pct < 20 ? "text-rec-400" : "text-brass-400"}>{remaining}</span>
            </div>
            <div className="h-1 overflow-hidden bg-paper/10">
              <div
                className={`h-full transition-all duration-700 ${pct < 20 ? "bg-rec-500" : "bg-brass-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Rail({ active }: { active: string }) {
  const app = useApp();
  return (
    <nav className="fixed bottom-8 left-0 top-14 z-40 hidden w-14 flex-col border-r border-line-soft bg-ink-850/70 backdrop-blur-sm md:flex xl:w-44">
      {NAV.map((n) => {
        const isActive = active === n.id;
        const Icon = n.icon;
        return (
          <a
            key={n.id}
            href={`#${n.id}`}
            className={`group relative flex items-center gap-3 px-0 py-4 transition-colors xl:px-5 ${
              isActive ? "text-brass-400" : "text-dim hover:text-paper"
            }`}
          >
            {isActive && <span className="absolute inset-y-2 left-0 w-[2.5px] bg-brass-500" />}
            <span className="mx-auto xl:mx-0">
              <Icon size={17} className={isActive ? "" : "transition-transform group-hover:-translate-y-0.5"} />
            </span>
            <span className="hidden flex-1 font-mono text-[10.5px] uppercase tracking-[0.18em] xl:block">{n.label}</span>
            {n.id === "queue" && app.running > 0 && (
              <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center bg-rec-500 px-1 font-mono text-[9px] font-bold text-ink-950 xl:static xl:h-5 xl:min-w-5">
                {app.running}
              </span>
            )}
          </a>
        );
      })}

      <div className="mt-auto hidden border-t border-line-soft p-4 xl:block">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-dim">rig status</div>
        <div className="mt-2 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${app.running ? "rec-dot bg-rec-500" : "bg-jade-400"}`} />
          <span className="font-mono text-[10px] text-mut">{app.running ? `${app.running} rendering` : "all nodes idle"}</span>
        </div>
      </div>
    </nav>
  );
}

function MobileNav({ active }: { active: string }) {
  return (
    <nav className="sticky top-14 z-40 flex gap-1 overflow-x-auto border-b border-line-soft bg-ink-900/90 px-3 py-2 backdrop-blur-md md:hidden">
      {NAV.map((n) => (
        <a
          key={n.id}
          href={`#${n.id}`}
          className={`shrink-0 border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
            active === n.id ? "border-brass-500/60 bg-brass-900/30 text-brass-300" : "border-line-soft text-dim"
          }`}
        >
          {n.label}
        </a>
      ))}
    </nav>
  );
}

function Slate() {
  const app = useApp();
  const [latency, setLatency] = useState(47);
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const iv = window.setInterval(() => {
      setLatency(36 + Math.floor(Math.random() * 58));
      setClock(Date.now());
    }, 3000);
    return () => window.clearInterval(iv);
  }, []);

  const ticker = "HAILUO-02 · VIDEO-01 · VIDEO-01-LIVE · I2V-01 · T2V-01-DIRECTOR · 768P · 1080P · 25 FPS · 6S · 10S · PROMPT OPTIMIZER · FIRST-FRAME · CAMERA CONTROL · ";

  return (
    <div className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-end gap-8 px-4 pb-8 pt-10 sm:px-6 lg:grid-cols-12 lg:pt-14">
        {/* left: wordmark */}
        <div className="lg:col-span-8">
          <Reveal>
            <div className="mb-4 flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-mut">
              <span className="border border-line-soft px-2 py-1">scene 01</span>
              <span className="border border-line-soft px-2 py-1">take {String(app.tasks.length + 1).padStart(2, "0")}</span>
              <span className="border border-line-soft px-2 py-1 text-steel-300">roll · video_generation</span>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="font-display text-[clamp(1.9rem,5.2vw,3.6rem)] font-extrabold leading-[1.04] tracking-tight text-paper">
              OPERATE THE
              <br />
              HAILUO <span className="text-brass-400">RENDER RIG</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-5 max-w-xl text-[14.5px] leading-relaxed text-mut">
              A field console for the MiniMax video generation APIs — compose <span className="font-mono text-[13px] text-steel-300">POST /v1/video_generation</span>{" "}
              payloads visually, watch tasks walk the state machine in real time, and pull signed file URLs when the frames land.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-dim">
              <span>◍ 5 models wired</span>
              <span>◍ 2 regions</span>
              <span>◍ async task_id flow</span>
              <span className="text-jade-400">◍ simulated locally</span>
            </div>
          </Reveal>
        </div>

        {/* right: clapperboard telemetry card */}
        <Reveal delay={200} className="lg:col-span-4">
          <div className="panel relative overflow-hidden">
            {/* clapperboard top */}
            <div className="relative h-9 overflow-hidden border-b border-line-soft">
              <div className="absolute inset-0 flex" style={{ transform: "skewX(-18deg) scale(1.3)", transformOrigin: "center" }}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i} className={`h-full flex-1 ${i % 2 ? "bg-brass-500/80" : "bg-ink-950"}`} />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-px bg-line-soft">
              {[
                { k: "operator", v: "you" },
                { k: "date", v: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) },
                { k: "endpoint", v: REGION_HOST[app.region] },
                { k: "latency", v: `${latency} ms` },
              ].map((f) => (
                <div key={f.k} className="bg-ink-850 px-4 py-3">
                  <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-dim">{f.k}</div>
                  <div className="mt-1 truncate font-mono text-[12px] text-paper">{f.v}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-line-soft px-4 py-3">
              <span className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-dim">local time</span>
              <span className="font-mono text-[13px] tabular-nums text-brass-400">{fmtClock(clock)}<span className="caret">:</span></span>
            </div>
            {/* equalizer */}
            <div className="flex h-10 items-end gap-1 border-t border-line-soft px-4 py-2">
              {Array.from({ length: 24 }).map((_, i) => (
                <span
                  key={i}
                  className="eq-bar flex-1 bg-steel-500/50"
                  style={{ height: `${18 + ((i * 37) % 70)}%`, animationDuration: `${0.5 + ((i * 13) % 9) / 10}s`, animationDelay: `${(i % 7) * 0.08}s` }}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>

      {/* marquee */}
      <div className="hairline-t overflow-hidden border-t border-line-soft bg-ink-950/60 py-2">
        <div className="marquee flex w-max whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.3em] text-dim">
          <span>{ticker}{ticker}</span>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  const app = useApp();
  const lastLine = app.wire[app.wire.length - 1];
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex h-8 items-center gap-4 border-t border-line-soft bg-ink-950/95 px-4 font-mono text-[10px] backdrop-blur-sm">
      <span className="flex items-center gap-1.5">
        {app.running ? (
          <>
            <span className="rec-dot h-1.5 w-1.5 rounded-full bg-rec-500" />
            <span className="uppercase tracking-[0.18em] text-rec-400">rec · {app.running}</span>
          </>
        ) : (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-jade-400" />
            <span className="uppercase tracking-[0.18em] text-dim">standby</span>
          </>
        )}
      </span>
      <span className="hidden min-w-0 flex-1 truncate text-dim sm:block">
        {lastLine ? (
          <>
            <span className={lastLine.method === "POST" ? "text-brass-400" : "text-steel-400"}>{lastLine.method}</span>{" "}
            <span className="text-paper/60">{lastLine.path}</span> <span className="text-jade-400">{lastLine.status}</span>{" "}
            <span>· {lastLine.note}</span>
          </>
        ) : (
          <>console warm · no traffic yet</>
        )}
        <span className="caret text-brass-400">▌</span>
      </span>
      <span className="ml-auto hidden text-dim lg:block">{REGION_HOST[app.region]}</span>
      <span className="text-dim">v1.4.0-sim</span>
    </footer>
  );
}

function Shell() {
  const [active, setActive] = useState("studio");

  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  return (
    <div className="scanlines relative min-h-screen">
      {/* ambient layers */}
      <div className="grid-layer pointer-events-none fixed inset-0 z-0" />
      <div className="noise-layer pointer-events-none fixed inset-0 z-[1]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_40%_at_18%_-5%,rgba(255,178,36,0.07),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_50%_40%_at_90%_10%,rgba(108,151,207,0.08),transparent_60%)]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(32,203,166,0.05),transparent_60%)]" />

      <Masthead />
      <Rail active={active} />
      <MobileNav active={active} />

      <main className="relative z-10 pb-24 md:pl-14 xl:pl-44">
        <Slate />

        <div className="mx-auto max-w-7xl space-y-20 px-4 pb-16 pt-14 sm:px-6">
          <div>
            <SectionHead index="01" title="Generation Studio" note="compose · build request" />
            <Studio />
          </div>
          <div>
            <SectionHead index="02" title="Render Queue" note="task_id · state machine · wire" />
            <Queue />
          </div>
          <div>
            <SectionHead index="03" title="Screening Room" note="finished renders · file_url" />
            <Library />
          </div>
          <div>
            <SectionHead index="04" title="Endpoint Reference" note="rest · async · signed urls" />
            <Docs />
          </div>
          <div>
            <SectionHead index="05" title="Key Bay" note="bearer tokens · rotate freely" />
            <Keys />
          </div>

          <footer className="hairline-t flex flex-col items-start justify-between gap-3 border-t border-line-soft pt-6 font-mono text-[10.5px] text-dim sm:flex-row sm:items-center">
            <span>MOTION/CONSOLE — an unofficial operator UI for the MiniMax video generation APIs.</span>
            <span>renders &amp; traffic simulated in-browser · no data leaves this tab</span>
          </footer>
        </div>
      </main>

      <StatusBar />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
