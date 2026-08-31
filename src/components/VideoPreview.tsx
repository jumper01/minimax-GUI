import { useEffect, useRef, useState } from "react";
import { GenTask, ratioToAspect } from "../lib/api";
import { IconFilm, IconPause, IconPlay } from "./ui";

function tc(secs: number, fps = 25): string {
  const s = Math.floor(secs);
  const f = Math.floor((secs - s) * fps);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  const ff = String(f).padStart(2, "0");
  return `00:${mm}:${ss}:${ff}`;
}

export function VideoPreview({ task, variant = 0 }: { task: GenTask; variant?: number }) {
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
      return;
    }
    const loop = (now: number) => {
      if (last.current != null) {
        setT((prev) => (prev + (now - last.current!) / 1000) % task.duration);
      }
      last.current = now;
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [playing, task.duration]);

  const ratio = task.ratio ?? "16:9";
  const wide = ratio === "16:9" || ratio === "21:9" || ratio === "4:3" || ratio === "adaptive";
  const kb = variant % 2 === 0 ? "kenburns-a" : "kenburns-b";

  return (
    <div
      className="group/player relative w-full cursor-pointer select-none overflow-hidden border border-line-soft bg-ink-950"
      style={{ aspectRatio: ratioToAspect(ratio) }}
      onClick={() => setPlaying((p) => !p)}
      role="button"
      aria-label={playing ? "Pause preview" : "Play preview"}
    >
      {/* frame */}
      <div className={`absolute inset-0 ${playing ? "" : "kb-paused"}`}>
        <img
          src={task.imageUrl}
          alt={task.prompt.slice(0, 60)}
          className={`h-full w-full object-cover ${kb}`}
          draggable={false}
        />
      </div>

      {/* film grain + vignette */}
      <div className="noise-layer pointer-events-none absolute inset-0 opacity-[0.12]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,8,13,0.55)_100%)]" />

      {/* letterbox (wide ratios only) */}
      {wide && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[7%] bg-ink-950" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[7%] bg-ink-950" />
        </>
      )}

      {/* top meta strip */}
      <div className={`pointer-events-none absolute left-2.5 ${wide ? "top-[9%]" : "top-2.5"} flex flex-wrap items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/70`}>
        <span className="border border-paper/20 bg-ink-950/60 px-1.5 py-0.5">{task.model}</span>
        <span className="border border-paper/20 bg-ink-950/60 px-1.5 py-0.5">{task.resolution} · {task.duration}s · {ratio}</span>
      </div>

      {/* rec dot while playing */}
      {playing && (
        <div className={`pointer-events-none absolute right-2.5 ${wide ? "top-[9%]" : "top-2.5"} flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-rec-400`}>
          <span className="rec-dot h-1.5 w-1.5 rounded-full bg-rec-500" />
          preview
        </div>
      )}

      {/* center play state */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${playing ? "opacity-0 group-hover/player:opacity-100" : "opacity-100"}`}
      >
        <span className="flex h-14 w-14 items-center justify-center border border-paper/25 bg-ink-950/70 text-paper backdrop-blur-sm transition-transform duration-300 group-hover/player:scale-110">
          {playing ? <IconPause size={20} /> : <IconPlay size={20} />}
        </span>
      </div>

      {/* bottom control strip */}
      <div className={`absolute inset-x-0 ${wide ? "bottom-[7%]" : "bottom-2.5"} px-2.5 pb-1.5`} onClick={(e) => e.stopPropagation()}>
        <div
          className="relative h-1 w-full cursor-pointer bg-paper/15"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setT(((e.clientX - r.left) / r.width) * task.duration);
          }}
        >
          <div className="absolute inset-y-0 left-0 bg-brass-500" style={{ width: `${(t / task.duration) * 100}%` }} />
          <div
            className="absolute top-1/2 h-2.5 w-[3px] -translate-y-1/2 bg-brass-300 shadow-[0_0_8px_rgba(255,178,36,0.8)]"
            style={{ left: `calc(${(t / task.duration) * 100}% - 1px)` }}
          />
        </div>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] tracking-wider text-paper/70">
          <span className="tabular-nums">{tc(t)}</span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="btn-press flex items-center gap-1 border border-paper/20 bg-ink-950/70 px-2 py-0.5 uppercase tracking-[0.16em] text-paper/80 hover:border-brass-500/60 hover:text-brass-300"
          >
            {playing ? <IconPause size={10} /> : <IconPlay size={10} />}
            {playing ? "pause" : "play"}
          </button>
          <span className="tabular-nums">{tc(task.duration)}</span>
        </div>
      </div>

      <IconFilm size={12} className={`pointer-events-none absolute left-2.5 ${wide ? "bottom-[9%]" : "bottom-9"} text-paper/30`} />
    </div>
  );
}

/* placeholder while a task is still rendering */
export function GeneratingFrame({ task }: { task: GenTask }) {
  const ratio = task.ratio ?? "16:9";
  return (
    <div className="relative w-full overflow-hidden border border-line-soft bg-ink-950" style={{ aspectRatio: ratioToAspect(ratio) }}>
      <div className="absolute inset-0 opacity-40 [background:repeating-linear-gradient(0deg,rgba(140,165,205,0.06)_0_2px,transparent_2px_6px)]" />
      <div className="shimmer absolute inset-0" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-brass-300">
          <span className="rec-dot h-2 w-2 rounded-full bg-brass-400" />
          status: {task.status}
        </span>
        {task.status === "running" && (
          <>
            <span className="font-display text-3xl font-bold tabular-nums text-paper">{Math.round(task.progress)}%</span>
            <div className="h-1 w-48 max-w-full overflow-hidden bg-paper/10">
              <div className="progress-stripes h-full bg-brass-500/80 transition-all duration-500" style={{ width: `${task.progress}%` }} />
            </div>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
              frame ~{Math.floor((task.progress / 100) * task.duration * 25)}/{task.duration * 25} · 25 fps
            </span>
          </>
        )}
        {task.status === "queued" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-dim">waiting for a render node…</span>
        )}
      </div>
    </div>
  );
}
