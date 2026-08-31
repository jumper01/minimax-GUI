import { useEffect, useMemo, useRef, useState } from "react";
import { TaskStatus, fmtAgo, fmtClock, sampleQueryResponse } from "../lib/api";
import { useApp } from "../lib/store";
import { GeneratingFrame, VideoPreview } from "./VideoPreview";
import { CodeBlock, CopyChip, IconChevron, IconRetry, IconSignal, IconTrash } from "./ui";

const ACTIVE: TaskStatus[] = ["queued", "running"];

function modeTag(t: { mode: string; firstFrame?: string; lastFrame?: string; refs?: string[] }): string {
  if (t.mode === "i2v") {
    if (t.firstFrame && t.lastFrame) return "i2v · first+last";
    if (t.lastFrame) return "i2v · last_frame";
    return "i2v · first_frame";
  }
  if (t.mode === "r2v") return `r2v · ref×${t.refs?.length ?? 0}`;
  return "t2v";
}

export function Queue() {
  const app = useApp();
  const [open, setOpen] = useState<string | null>(app.tasks[0]?.id ?? null);
  const logRef = useRef<HTMLDivElement>(null);

  const running = app.tasks.filter((t) => ACTIVE.includes(t.status));
  const finished = app.tasks.filter((t) => t.status === "succeeded").length;
  const failed = app.tasks.filter((t) => t.status === "failed").length;
  const avgRender = useMemo(() => {
    const done = app.tasks.filter((t) => t.finishedAt);
    if (!done.length) return "—";
    const avg = done.reduce((a, t) => a + (t.finishedAt! - t.createdAt), 0) / done.length / 1000;
    return `${avg.toFixed(1)}s`;
  }, [app.tasks]);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [app.wire.length]);

  const topId = app.tasks[0]?.id;
  useEffect(() => {
    if (topId) setOpen(topId);
  }, [topId]);

  return (
    <section id="queue" className="scroll-mt-24">
      {/* stat strip */}
      <div className="mb-6 grid grid-cols-2 gap-px border border-line-soft bg-line-soft sm:grid-cols-4">
        {[
          { label: "in pipeline", value: String(running.length), tone: running.length ? "text-brass-400" : "text-paper" },
          { label: "succeeded", value: String(finished), tone: "text-jade-400" },
          { label: "failed", value: String(failed), tone: failed ? "text-rec-400" : "text-paper" },
          { label: "avg wall time", value: avgRender, tone: "text-brass-400" },
        ].map((s) => (
          <div key={s.label} className="group bg-ink-850 px-5 py-4 transition-colors hover:bg-ink-800">
            <div className={`font-display text-2xl font-bold tabular-nums ${s.tone}`}>{s.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-dim group-hover:text-mut">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* pipeline */}
        <div className="xl:col-span-8">
          <div className="panel">
            <div className="hairline-b flex items-center justify-between px-5 py-3.5">
              <span className="panel-title">Pipeline · task_id tracker</span>
              {app.tasks.some((t) => t.status === "succeeded" || t.status === "failed") && (
                <button
                  onClick={() => {
                    app.clearFinished();
                    app.toast("ok", "Finished tasks swept from the pipeline");
                  }}
                  className="btn-press flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-dim transition-colors hover:text-rec-400"
                >
                  <IconTrash size={11} /> clear finished
                </button>
              )}
            </div>

            {app.tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
                <svg width="64" height="40" viewBox="0 0 64 40" fill="none" className="text-dim">
                  <rect x="2" y="6" width="60" height="28" stroke="currentColor" strokeDasharray="4 4" />
                  <path d="M26 14l12 6-12 6V14z" fill="currentColor" />
                </svg>
                <p className="max-w-xs text-[13px] leading-relaxed text-mut">
                  Nothing on the render rig yet. Compose a prompt upstairs and hit{" "}
                  <span className="font-mono text-brass-400">Generate</span> — the task will land here with its{" "}
                  <span className="font-mono text-steel-300">task_id</span>.
                </p>
              </div>
            ) : (
              <ul>
                {app.tasks.map((t) => {
                  const active = ACTIVE.includes(t.status);
                  const expanded = open === t.id;
                  return (
                    <li key={t.id} className={`hairline-b last:border-b-0 ${expanded ? "bg-ink-800/50" : "transition-colors hover:bg-ink-800/30"}`}>
                      <button onClick={() => setOpen(expanded ? null : t.id)} className="flex w-full items-center gap-3.5 px-5 py-3.5 text-left">
                        <IconChevron size={12} className={`shrink-0 text-dim transition-transform duration-300 ${expanded ? "rotate-90 text-brass-400" : ""}`} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-paper/90">{t.prompt}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
                            <span className="text-mut">{t.model}</span>
                            <span>{t.resolution} · {t.duration}s · {t.ratio}</span>
                            <span className="text-steel-300">{modeTag(t)}</span>
                            <span>{fmtAgo(t.createdAt)}</span>
                          </span>
                        </span>
                        {active && t.status === "running" && (
                          <span className="hidden w-24 shrink-0 sm:block">
                            <span className="block h-1 overflow-hidden bg-paper/10">
                              <span className="progress-stripes block h-full bg-brass-500/80 transition-all duration-500" style={{ width: `${t.progress}%` }} />
                            </span>
                            <span className="mt-1 block text-right font-mono text-[9.5px] tabular-nums text-dim">{Math.round(t.progress)}%</span>
                          </span>
                        )}
                        <StatusMini status={t.status} />
                      </button>

                      {expanded && (
                        <div className="fade-up grid gap-4 border-t border-line-soft px-5 py-4 lg:grid-cols-5">
                          <div className="lg:col-span-3">
                            {t.status === "succeeded" && t.imageUrl ? (
                              <VideoPreview task={t} variant={t.id.length} />
                            ) : active ? (
                              <GeneratingFrame task={t} />
                            ) : t.status === "failed" ? (
                              <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 border border-rec-500/30 bg-rec-900/20 px-6 text-center">
                                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-rec-400">status: failed</span>
                                <p className="max-w-sm text-[12px] leading-relaxed text-mut">{t.error}</p>
                              </div>
                            ) : null}
                          </div>
                          <div className="space-y-3 lg:col-span-2">
                            <div>
                              <div className="panel-title mb-1.5">task_id</div>
                              <CopyChip text={t.taskId} short={`${t.taskId.slice(0, 14)}…`} />
                            </div>
                            {t.contentUrl && (
                              <div>
                                <div className="panel-title mb-1.5">task.content.url</div>
                                <CopyChip text={t.contentUrl} short={`${t.contentUrl.slice(0, 26)}…`} />
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[10.5px] text-dim">
                              <span>scenario <span className="text-mut">{t.mode}</span></span>
                              <span>ratio <span className="text-mut">{t.ratio}</span></span>
                              <span>cost <span className="text-brass-400">{t.cost} cr</span></span>
                              <span>polls <span className="text-mut">{t.polls}</span></span>
                              <span>created <span className="text-mut">{fmtClock(t.createdAt)}</span></span>
                              <span>finished <span className="text-mut">{t.finishedAt ? fmtClock(t.finishedAt) : "—"}</span></span>
                            </div>
                            {t.status === "succeeded" && (
                              <CodeBlock
                                lang="json"
                                label="last query response"
                                code={sampleQueryResponse({
                                  taskId: t.taskId,
                                  model: t.model,
                                  resolution: t.resolution,
                                  duration: t.duration,
                                  ratio: t.ratio,
                                  imageCount: t.mode === "i2v" ? (t.firstFrame && t.lastFrame ? 2 : 1) : t.mode === "r2v" ? t.refs?.length ?? 0 : 0,
                                })}
                              />
                            )}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {t.status === "failed" && (
                                <button
                                  onClick={() => app.retry(t.id)}
                                  className="btn-press inline-flex items-center gap-1.5 border border-brass-500/50 bg-brass-900/30 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-brass-300 hover:bg-brass-900/60"
                                >
                                  <IconRetry size={11} /> retry
                                </button>
                              )}
                              {t.status === "succeeded" && t.contentUrl && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard?.writeText(t.contentUrl!).catch(() => undefined);
                                    app.toast("ok", "content.url copied");
                                  }}
                                  className="btn-press inline-flex items-center gap-1.5 border border-jade-500/50 bg-jade-900/30 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-jade-300 hover:bg-jade-900/60"
                                >
                                  <IconSignal size={11} /> copy url
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  app.removeTask(t.id);
                                  if (open === t.id) setOpen(null);
                                }}
                                className="btn-press inline-flex items-center gap-1.5 border border-line-soft px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-wider text-dim hover:border-rec-500/40 hover:text-rec-400"
                              >
                                <IconTrash size={11} /> drop
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* wire log */}
        <div className="xl:col-span-4">
          <div className="panel flex h-full flex-col">
            <div className="hairline-b flex items-center justify-between px-5 py-3.5">
              <span className="panel-title">Wire log · stdout</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-dim">
                <span className={`h-1.5 w-1.5 rounded-full ${app.running ? "rec-dot bg-rec-500" : "bg-jade-400"}`} />
                {app.running ? "streaming" : "idle"}
              </span>
            </div>
            <div ref={logRef} className="min-h-[280px] flex-1 overflow-y-auto p-4 font-mono text-[10.5px] leading-[1.9]" style={{ maxHeight: 520 }}>
              {app.wire.length === 0 ? (
                <p className="text-dim">
                  $ awaiting traffic<span className="caret text-brass-400">▌</span>
                </p>
              ) : (
                app.wire.map((l, i) => (
                  <div key={i} className="ticker-in flex gap-2 whitespace-nowrap">
                    <span className="shrink-0 text-dim">{fmtClock(l.t)}</span>
                    <span className={`shrink-0 font-semibold ${l.method === "POST" ? "text-brass-400" : "text-steel-400"}`}>{l.method}</span>
                    <span className="truncate text-paper/75">{l.path}</span>
                    <span className="ml-auto shrink-0 text-jade-400">{l.status}</span>
                    <span className="shrink-0 text-dim">· {l.note}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatusMini({ status }: { status: TaskStatus }) {
  const tone =
    status === "succeeded"
      ? "text-jade-400 border-jade-500/40"
      : status === "failed"
        ? "text-rec-400 border-rec-500/40"
        : status === "running"
          ? "text-brass-300 border-brass-500/40"
          : "text-steel-300 border-steel-500/40";
  return (
    <span className={`shrink-0 border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.12em] ${tone}`}>{status}</span>
  );
}
