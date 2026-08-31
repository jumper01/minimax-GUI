import React, { useMemo, useState } from "react";
import {
  Mode,
  MODEL_LIST,
  PROMPT_IDEAS,
  RATIOS,
  REGION_HOST,
  Ratio,
  Resolution,
  STILLS,
  buildBody,
  buildCreateCurl,
  buildQueryCurl,
  estimateCost,
  modelById,
  sampleCreateResponse,
  sampleQueryResponse,
} from "../lib/api";
import { useApp } from "../lib/store";
import { CodeBlock, IconBolt, IconCheck, Reveal } from "./ui";

const stillUrl = (id: string) => STILLS.find((s) => s.id === id)?.url;

function Label({ n, text, hint }: { n: string; text: string; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between gap-3">
      <span className="panel-title">
        <span className="text-brass-500">{n}</span> · {text}
      </span>
      {hint && <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-dim">{hint}</span>}
    </div>
  );
}

function Seg({ options, value, onChange, disabledIds }: { options: { id: string; label: string; sub?: string }[]; value: string; onChange: (v: string) => void; disabledIds?: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const disabled = disabledIds?.includes(o.id);
        const on = o.id === value;
        return (
          <button
            key={o.id}
            disabled={disabled}
            onClick={() => onChange(o.id)}
            title={disabled ? `${o.label} not supported on this model` : undefined}
            className={`btn-press border px-3 py-2 text-left transition-colors ${
              on
                ? "border-brass-500/70 bg-brass-900/40 text-brass-300"
                : disabled
                ? "cursor-not-allowed border-line-soft text-dim/50"
                : "border-line-soft bg-ink-950/50 text-mut hover:border-steel-500/50 hover:text-paper"
            }`}
          >
            <span className="block font-mono text-[11px] uppercase tracking-[0.12em]">{o.label}</span>
            {o.sub && <span className={`mt-0.5 block font-mono text-[9px] tracking-wide ${on ? "text-brass-400/70" : "text-dim"}`}>{o.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

function StillPick({ stillId, onPick, small }: { stillId?: string; onPick: (id: string) => void; small?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STILLS.map((s) => {
        const on = s.id === stillId;
        return (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className={`btn-press group relative overflow-hidden border transition-all ${small ? "h-14 w-24" : "h-16 w-28"} ${
              on ? "border-brass-500 shadow-[0_0_0_1px_rgba(255,178,36,0.5),0_6px_20px_-8px_rgba(255,178,36,0.45)]" : "border-line-soft opacity-70 hover:opacity-100"
            }`}
            title={s.label}
          >
            <img src={s.url} alt={s.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" draggable={false} />
            <span className="absolute inset-x-0 bottom-0 bg-ink-950/80 px-1 py-0.5 text-left font-mono text-[8px] uppercase tracking-wider text-paper/80">{s.label}</span>
            {on && (
              <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-brass-500 text-ink-950">
                <IconCheck size={10} strokeWidth={2.6} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Studio() {
  const app = useApp();
  const activeKey = app.keys.find((k) => k.id === app.activeKeyId);

  const [model, setModel] = useState("MiniMax-H3");
  const [mode, setMode] = useState<Mode>("t2v");
  const [frameCfg, setFrameCfg] = useState<"first" | "last" | "both">("first");
  const [prompt, setPrompt] = useState(PROMPT_IDEAS[0].prompt);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [duration, setDuration] = useState(5);
  const [ratio, setRatio] = useState<Ratio>("16:9");
  const [firstFrame, setFirstFrame] = useState("dancer");
  const [lastFrame, setLastFrame] = useState("forest");
  const [refs, setRefs] = useState<string[]>(["forest"]);

  const info = modelById(model);

  const chooseModel = (id: string) => {
    const m = modelById(id);
    setModel(id);
    if (!m.resolutions.includes(resolution)) setResolution(m.resolutions[m.resolutions.length - 1]);
    setDuration((d) => Math.min(m.durMax, Math.max(m.durMin, d)));
    if (!m.modes.includes(mode)) setMode("t2v");
  };

  const body = useMemo(
    () =>
      buildBody({
        model,
        prompt: prompt.trim() || " ",
        mode,
        resolution,
        duration,
        ratio,
        firstFrame: mode === "i2v" && frameCfg !== "last" ? stillUrl(firstFrame) : undefined,
        lastFrame: mode === "i2v" && frameCfg !== "first" ? stillUrl(lastFrame) : undefined,
        refs: mode === "r2v" ? refs.map((r) => stillUrl(r)!).filter(Boolean) : undefined,
      }),
    [model, prompt, mode, resolution, duration, ratio, firstFrame, lastFrame, refs, frameCfg]
  );

  const host = REGION_HOST[app.region];
  const token = activeKey?.key ?? "<token>";
  const createCurl = useMemo(() => buildCreateCurl(host, token, body), [host, token, body]);
  const queryCurl = useMemo(() => buildQueryCurl(host, token, "424010985738629"), [host, token]);
  const respCreate = useMemo(() => sampleCreateResponse("424010985738629"), []);
  const respQuery = useMemo(
    () =>
      sampleQueryResponse({
        taskId: "424010985738629",
        model,
        resolution,
        duration,
        ratio: mode === "i2v" ? "adaptive" : ratio,
        imageCount: mode === "i2v" ? (frameCfg === "both" ? 2 : 1) : mode === "r2v" ? refs.length : 0,
      }),
    [model, resolution, duration, ratio, mode, frameCfg, refs.length]
  );

  const cost = estimateCost(model, resolution, duration);

  const submit = () => {
    if (!prompt.trim()) {
      app.toast("err", "content must include a non-empty text item — prompt is required (2013)");
      return;
    }
    if (mode === "r2v" && refs.length === 0) {
      app.toast("err", "Reference mode needs at least one reference_image in content.");
      return;
    }
    const t = app.generate({
      mode,
      model,
      prompt: prompt.trim(),
      resolution,
      duration,
      ratio,
      firstFrame: mode === "i2v" && frameCfg !== "last" ? stillUrl(firstFrame) : undefined,
      lastFrame: mode === "i2v" && frameCfg !== "first" ? stillUrl(lastFrame) : undefined,
      refs: mode === "r2v" ? refs.map((r) => stillUrl(r)!).filter(Boolean) : undefined,
    });
    if (t) {
      window.setTimeout(() => document.getElementById("queue")?.scrollIntoView({ behavior: "smooth", block: "start" }), 350);
    }
  };

  const toggleRef = (id: string) =>
    setRefs((r) => (r.includes(id) ? r.filter((x) => x !== id) : r.length >= 3 ? (app.toast("warn", "Reference images cap at 3 per request"), r) : [...r, id]));

  const ratioOptions = mode === "i2v" ? [] : RATIOS;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      {/* ---------------- compose ---------------- */}
      <Reveal className="lg:col-span-7">
        <div className="panel">
          <div className="hairline-b flex items-center justify-between px-5 py-3">
            <span className="panel-title">compose · POST {"/v2/video_generation"}</span>
            <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-jade-400">
              <span className="h-1.5 w-1.5 rounded-full bg-jade-400" /> H3 engine
            </span>
          </div>

          <div className="space-y-6 px-5 py-5">
            {/* model */}
            <section>
              <Label n="01" text="model" hint="video_generation · v2" />
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {MODEL_LIST.map((m) => {
                  const on = m.id === model;
                  return (
                    <button
                      key={m.id}
                      onClick={() => chooseModel(m.id)}
                      className={`btn-press group relative border p-4 text-left transition-all ${
                        on ? "border-brass-500/80 bg-brass-900/25" : "border-line-soft bg-ink-950/40 hover:border-steel-500/50 hover:bg-ink-950/70"
                      }`}
                    >
                      {on && <span className="absolute left-0 top-0 h-full w-[3px] bg-brass-500" />}
                      <div className="flex items-baseline justify-between">
                        <span className={`font-display text-[15px] font-bold tracking-tight ${on ? "text-brass-300" : "text-paper"}`}>{m.id}</span>
                        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-dim">{m.durMin}–{m.durMax}s</span>
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-mut">{m.tag}</div>
                      <ul className="mt-3 space-y-1.5">
                        {m.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12px] leading-snug text-mut">
                            <IconCheck size={11} className={`mt-0.5 shrink-0 ${on ? "text-brass-400" : "text-dim"}`} />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {m.resolutions.map((r) => (
                          <span key={r} className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider ${on ? "border-brass-500/50 text-brass-300" : "border-line-soft text-dim"}`}>{r}</span>
                        ))}
                        {m.modes.map((md) => (
                          <span key={md} className="border border-line-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-dim">{md}</span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* mode */}
            <section>
              <Label n="02" text="scenario" hint="content[] roles" />
              <Seg
                value={mode}
                onChange={(v) => setMode(v as Mode)}
                disabledIds={info.modes.filter((m) => m !== "t2v" && m !== "i2v" && m !== "r2v").length ? [] : info.modes.includes("r2v") ? [] : ["r2v"]}
                options={[
                  { id: "t2v", label: "T2V", sub: "text only · ratio required" },
                  { id: "i2v", label: "I2V", sub: "first / last frame · adaptive" },
                  { id: "r2v", label: "R2V", sub: "reference_image media" },
                ]}
              />
            </section>

            {/* prompt */}
            <section>
              <Label n="03" text="prompt" hint={`${prompt.length} chars · content[type=text]`} />
              <div className="mb-2 flex flex-wrap gap-1.5">
                {PROMPT_IDEAS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    className={`btn-press border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                      prompt === p.prompt ? "border-brass-500/60 bg-brass-900/30 text-brass-300" : "border-line-soft text-mut hover:border-steel-500/50 hover:text-paper"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                placeholder="Describe the shot — subject, action, light, lens…"
                className="w-full resize-y border border-line-soft bg-ink-950/70 p-3.5 text-[13.5px] leading-relaxed text-paper placeholder:text-dim focus:border-brass-500/60 focus:outline-none"
              />
            </section>

            {/* frames / references */}
            {mode === "i2v" && (
              <section className="fade-up">
                <Label n="04" text="frame control" hint="image_url · roles" />
                <div className="mb-3">
                  <Seg
                    value={frameCfg}
                    onChange={(v) => setFrameCfg(v as typeof frameCfg)}
                    options={[
                      { id: "first", label: "first frame", sub: "role=first_frame" },
                      { id: "last", label: "last frame", sub: "role=last_frame" },
                      { id: "both", label: "first + last", sub: "two image_url items" },
                    ]}
                  />
                </div>
                {frameCfg !== "last" && (
                  <div className="mb-3">
                    <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">role = first_frame</div>
                    <StillPick stillId={firstFrame} onPick={setFirstFrame} />
                  </div>
                )}
                {frameCfg !== "first" && (
                  <div>
                    <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">role = last_frame</div>
                    <StillPick stillId={lastFrame} onPick={setLastFrame} />
                  </div>
                )}
                <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-dim">
                  ▸ aspect ratio follows the input image — the API ignores <span className="text-steel-300">ratio</span> and returns <span className="text-brass-300">adaptive</span>.
                </p>
              </section>
            )}

            {mode === "r2v" && (
              <section className="fade-up">
                <Label n="04" text="reference media" hint={`reference_image · ${refs.length}/3`} />
                <div className="flex flex-wrap gap-2">
                  {STILLS.map((s) => {
                    const on = refs.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleRef(s.id)}
                        className={`btn-press group relative h-16 w-28 overflow-hidden border transition-all ${
                          on ? "border-jade-400 shadow-[0_0_0_1px_rgba(59,232,196,0.45)]" : "border-line-soft opacity-70 hover:opacity-100"
                        }`}
                        title={s.label}
                      >
                        <img src={s.url} alt={s.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" draggable={false} />
                        <span className="absolute inset-x-0 bottom-0 bg-ink-950/80 px-1 py-0.5 text-left font-mono text-[8px] uppercase tracking-wider text-paper/80">{s.label}</span>
                        {on && (
                          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-jade-400 text-ink-950">
                            <IconCheck size={10} strokeWidth={2.6} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2.5 font-mono text-[10px] leading-relaxed text-dim">
                  ▸ up to 3 images (≤ 30 MB, 256–5760 px). H3 also accepts <span className="text-steel-300">reference_video</span> and <span className="text-steel-300">reference_audio</span> in content.
                </p>
              </section>
            )}

            {/* output */}
            <section>
              <Label n="05" text="output" hint={`${info.durMin}–${info.durMax}s integer`} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">resolution</div>
                  <Seg
                    value={resolution}
                    onChange={(v) => setResolution(v as Resolution)}
                    options={[
                      { id: "480P", label: "480P" },
                      { id: "768P", label: "768P" },
                      { id: "2K", label: "2K" },
                    ].filter((o) => info.resolutions.includes(o.id as Resolution))}
                  />
                </div>
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">duration</span>
                    <span className="font-display text-[15px] font-bold text-brass-300">{duration}s</span>
                  </div>
                  <input type="range" min={info.durMin} max={info.durMax} step={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value, 10))} className="w-full" />
                  <div className="mt-1 flex justify-between font-mono text-[9px] text-dim">
                    <span>{info.durMin}s</span>
                    <span>{info.durMax}s</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">ratio {mode === "i2v" && <span className="text-brass-400">· locked to adaptive</span>}</div>
                {mode === "i2v" ? (
                  <div className="inline-flex items-center gap-2 border border-brass-500/40 bg-brass-900/25 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] text-brass-300">
                    adaptive <span className="text-brass-500/70">— derived from input frame</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {mode === "r2v" && (
                      <button
                        onClick={() => setRatio("adaptive")}
                        className={`btn-press border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] ${
                          ratio === "adaptive" ? "border-brass-500/70 bg-brass-900/40 text-brass-300" : "border-line-soft text-mut hover:text-paper"
                        }`}
                      >
                        adaptive
                      </button>
                    )}
                    {ratioOptions.map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatio(r)}
                        className={`btn-press border px-3 py-2 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                          ratio === r ? "border-brass-500/70 bg-brass-900/40 text-brass-300" : "border-line-soft bg-ink-950/50 text-mut hover:border-steel-500/50 hover:text-paper"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* footer */}
          <div className="hairline-t flex flex-wrap items-center gap-4 border-t border-line-soft px-5 py-4">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-dim">
              est. cost <span className="ml-1 font-display text-[16px] font-bold normal-case tracking-tight text-brass-300">{cost}</span> credits
            </div>
            <div className="hidden font-mono text-[10px] text-dim sm:block">
              {model} · {resolution} · {duration}s · {mode === "i2v" ? "adaptive" : ratio}
            </div>
            <button
              onClick={submit}
              className="btn-press ml-auto inline-flex items-center gap-2 border border-brass-400 bg-brass-500 px-5 py-2.5 font-display text-[12.5px] font-bold uppercase tracking-[0.08em] text-ink-950 shadow-[0_8px_30px_-10px_rgba(255,178,36,0.65)] transition-all hover:bg-brass-400 hover:shadow-[0_10px_36px_-8px_rgba(255,178,36,0.8)]"
            >
              <IconBolt size={14} />
              Generate video
            </button>
          </div>
        </div>
      </Reveal>

      {/* ---------------- inspector ---------------- */}
      <Reveal delay={120} className="lg:col-span-5">
        <div className="space-y-4 lg:sticky lg:top-20">
          <div className="flex items-center justify-between">
            <span className="panel-title">request inspector · live</span>
            <span className="border border-steel-500/40 bg-steel-900/40 px-2 py-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-steel-300">{host}</span>
          </div>

          <CodeBlock lang="curl" label="create · cURL" code={createCurl} />
          <CodeBlock lang="json" label="request body" code={JSON.stringify(body, null, 2)} />
          <CodeBlock lang="json" label="200 · create → task_id" code={respCreate} />
          <CodeBlock lang="curl" label="poll · query task" code={queryCurl} />
          <CodeBlock lang="json" label="200 · query (succeeded)" code={respQuery} />

          <div className="panel px-4 py-3.5">
            <div className="panel-title mb-2.5">wire notes</div>
            <ul className="space-y-1.5 font-mono text-[10.5px] leading-relaxed text-mut">
              <li>▸ create returns only <span className="text-brass-300">task_id</span> — the render is fully async</li>
              <li>▸ poll the query endpoint, or set <span className="text-steel-300">callback_url</span> for push updates</li>
              <li>▸ statuses: queued → running → succeeded / failed / cancelled</li>
              <li>▸ on success, <span className="text-jade-300">task.content.url</span> is your signed CDN render</li>
              <li>▸ text-to-video requires a concrete <span className="text-brass-300">ratio</span> (never adaptive)</li>
            </ul>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
