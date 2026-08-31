import { useMemo, useState } from "react";
import {
  CAMERA_MOVES,
  MODELS,
  PROMPT_IDEAS,
  REGION_HOST,
  STILLS,
  buildBody,
  buildCreateCurl,
  buildQueryCurl,
  estimateCost,
  maskKey,
  sampleResponse,
} from "../lib/api";
import { useApp } from "../lib/store";
import { CodeBlock, IconBolt, IconChevron, IconKey, IconSpark } from "./ui";

type Tab = "body" | "curl" | "poll" | "resp";

export function Studio() {
  const app = useApp();
  const [mode, setMode] = useState<"t2v" | "i2v" | "director">("t2v");
  const [model, setModel] = useState(MODELS.t2v[0].id);
  const [prompt, setPrompt] = useState(PROMPT_IDEAS[0].prompt);
  const [resolution, setResolution] = useState<"768P" | "1080P">("768P");
  const [duration, setDuration] = useState<6 | 10>(6);
  const [optimizer, setOptimizer] = useState(true);
  const [camera, setCamera] = useState<string | undefined>("Travelling");
  const [firstFrame, setFirstFrame] = useState<string | undefined>(STILLS[0].url);
  const [tab, setTab] = useState<Tab>("curl");

  const activeKey = app.keys.find((k) => k.id === app.activeKeyId);
  const cost = estimateCost(mode, model, resolution, duration);

  const body = useMemo(
    () => buildBody({ mode, model, prompt: prompt.trim() || "…", resolution, duration, promptOptimizer: optimizer, camera, firstFrame }),
    [mode, model, prompt, resolution, duration, optimizer, camera, firstFrame]
  );

  const host = REGION_HOST[app.region];
  const latestTaskId = app.tasks[0]?.taskId ?? "1820471123900543…";

  const code = useMemo(() => {
    if (tab === "body") return JSON.stringify(body, null, 2);
    if (tab === "curl") return buildCreateCurl(host, activeKey ? maskKey(activeKey.key).replace("••••••••", "••••$KEY••••") : "<API_KEY>", body);
    if (tab === "poll") return buildQueryCurl(host, activeKey ? maskKey(activeKey.key).replace("••••••••", "••••$KEY••••") : "<API_KEY>", latestTaskId);
    return sampleResponse(latestTaskId);
  }, [tab, body, host, activeKey, latestTaskId]);

  const switchMode = (m: "t2v" | "i2v" | "director") => {
    setMode(m);
    setModel(MODELS[m][0].id);
    if (m === "director") {
      setResolution("768P");
      setDuration(6);
    }
  };

  const canGenerate = prompt.trim().length >= 8;

  return (
    <section id="studio" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* ============ compose ============ */}
        <div className="xl:col-span-7">
          <div className="panel">
            <div className="hairline-b flex items-center justify-between px-5 py-3.5">
              <span className="panel-title">Compose · request builder</span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">
                <span className={`h-1.5 w-1.5 rounded-full ${app.running ? "bg-rec-500 rec-dot" : "bg-jade-400"}`} />
                {app.running ? "rig busy" : "rig idle"}
              </span>
            </div>

            <div className="space-y-5 p-5">
              {/* mode tabs */}
              <div className="flex gap-1 border border-line-soft bg-ink-950/60 p-1">
                {(
                  [
                    ["t2v", "Text → Video"],
                    ["i2v", "Image → Video"],
                    ["director", "Director"],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    onClick={() => switchMode(m)}
                    className={`btn-press flex-1 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                      mode === m ? "bg-brass-500 text-ink-950" : "text-mut hover:bg-ink-750 hover:text-paper"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* model */}
              <div>
                <label className="panel-title mb-2 block">Model</label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {MODELS[mode].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`btn-press group flex items-center justify-between border px-3.5 py-2.5 text-left transition-colors ${
                        model === m.id ? "border-brass-500/70 bg-brass-900/30" : "border-line-soft bg-ink-950/40 hover:border-line hover:bg-ink-750/60"
                      }`}
                    >
                      <span>
                        <span className={`block font-mono text-[12.5px] ${model === m.id ? "text-brass-300" : "text-paper"}`}>{m.id}</span>
                        <span className="block text-[11px] text-dim">{m.tag}</span>
                      </span>
                      <IconChevron
                        size={12}
                        className={`shrink-0 transition-transform ${model === m.id ? "text-brass-400" : "text-dim group-hover:translate-x-0.5"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* prompt */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="panel-title">Prompt</label>
                  <span className={`font-mono text-[10px] tracking-wider ${prompt.length > 480 ? "text-brass-400" : "text-dim"}`}>{prompt.length}/500</span>
                </div>
                <div className="relative border border-line-soft bg-ink-950/60 transition-colors focus-within:border-brass-500/60">
                  <textarea
                    value={prompt}
                    maxLength={500}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Describe the shot: subject, motion, lens, light, mood…"
                    className="w-full resize-none bg-transparent p-3.5 text-[13.5px] leading-relaxed text-paper placeholder:text-dim focus:outline-none"
                  />
                  {optimizer && (
                    <span className="absolute bottom-2.5 right-3 flex items-center gap-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-jade-400">
                      <IconSpark size={10} /> optimizer on
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PROMPT_IDEAS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setPrompt(p.prompt)}
                      className={`btn-press border px-2.5 py-1 font-mono text-[10.5px] tracking-wide transition-colors ${
                        prompt === p.prompt
                          ? "border-steel-500/60 bg-steel-900/40 text-steel-300"
                          : "border-line-soft text-mut hover:border-steel-500/40 hover:text-steel-300"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* i2v first frame */}
              {mode === "i2v" && (
                <div className="fade-up">
                  <label className="panel-title mb-2 block">First frame · reference image</label>
                  <div className="grid grid-cols-5 gap-2">
                    {STILLS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setFirstFrame(s.url)}
                        className={`btn-press group relative overflow-hidden border transition-all ${
                          firstFrame === s.url ? "border-brass-500 shadow-[0_0_0_1px_rgba(255,178,36,0.5)]" : "border-line-soft opacity-70 hover:opacity-100"
                        }`}
                        style={{ aspectRatio: "16/10" }}
                        title={s.label}
                      >
                        <img src={s.url} alt={s.label} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        {firstFrame === s.url && <span className="absolute inset-0 border-2 border-brass-500/70" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* resolution + duration */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="panel-title mb-2 block">Resolution</label>
                  <div className={`flex border bg-ink-950/60 p-1 ${mode === "director" ? "pointer-events-none opacity-50" : "border-line-soft"}`}>
                    {(["768P", "1080P"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setResolution(r)}
                        className={`btn-press flex-1 py-1.5 font-mono text-[11.5px] tracking-wider ${
                          resolution === r ? "bg-ink-700 text-brass-300" : "text-dim hover:text-paper"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {mode === "director" && <p className="mt-1.5 text-[11px] text-dim">Director is locked to 768P.</p>}
                </div>
                <div>
                  <label className="panel-title mb-2 block">Duration</label>
                  <div className={`flex border bg-ink-950/60 p-1 ${mode === "director" ? "pointer-events-none opacity-50" : "border-line-soft"}`}>
                    {([6, 10] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setDuration(d)}
                        className={`btn-press flex-1 py-1.5 font-mono text-[11.5px] tracking-wider ${
                          duration === d ? "bg-ink-700 text-brass-300" : "text-dim hover:text-paper"
                        }`}
                      >
                        {d}s
                      </button>
                    ))}
                  </div>
                  {mode === "director" && <p className="mt-1.5 text-[11px] text-dim">Director renders a 6s take.</p>}
                </div>
              </div>

              {/* director camera moves */}
              {mode === "director" && (
                <div className="fade-up">
                  <label className="panel-title mb-2 block">Camera movement</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CAMERA_MOVES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCamera(camera === c ? undefined : c)}
                        className={`btn-press border px-2.5 py-1.5 font-mono text-[11px] tracking-wide transition-colors ${
                          camera === c
                            ? "border-rec-500/70 bg-rec-900/40 text-rec-400"
                            : "border-line-soft text-mut hover:border-rec-500/40 hover:text-paper"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* optimizer toggle */}
              <button onClick={() => setOptimizer((o) => !o)} className="btn-press group flex w-full items-center justify-between border border-line-soft bg-ink-950/40 px-3.5 py-2.5 hover:border-line">
                <span className="flex items-center gap-2.5">
                  <IconSpark size={14} className={optimizer ? "text-jade-400" : "text-dim"} />
                  <span className="text-left">
                    <span className="block text-[13px] text-paper">Prompt optimizer</span>
                    <span className="block text-[11px] text-dim">Rewrites short prompts into full shot descriptions server-side</span>
                  </span>
                </span>
                <span className={`relative h-5 w-9 shrink-0 border transition-colors ${optimizer ? "border-jade-500/60 bg-jade-900/60" : "border-line bg-ink-950"}`}>
                  <span
                    className={`absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 transition-all duration-200 ${optimizer ? "left-[18px] bg-jade-400" : "left-[3px] bg-dim"}`}
                  />
                </span>
              </button>

              {/* footer: cost + generate */}
              <div className="hairline-t -mx-5 -mb-5 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-xl font-bold text-brass-400">{cost}</span>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-dim">credits / render</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[10px] text-dim">
                    {500 - app.creditsUsed} of 500 left this cycle
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (!canGenerate) {
                      app.toast("warn", "Write at least a sentence of prompt first.");
                      return;
                    }
                    app.generate({ mode, model, prompt: prompt.trim(), resolution, duration, promptOptimizer: optimizer, camera, firstFrame });
                  }}
                  className={`btn-press group relative inline-flex items-center gap-2.5 px-6 py-3 font-display text-[13px] font-bold uppercase tracking-[0.08em] transition-all ${
                    canGenerate
                      ? "bg-brass-500 text-ink-950 shadow-[0_8px_30px_-8px_rgba(255,178,36,0.55)] hover:bg-brass-400 hover:shadow-[0_10px_36px_-6px_rgba(255,178,36,0.7)]"
                      : "cursor-not-allowed bg-ink-700 text-dim"
                  }`}
                >
                  <IconBolt size={15} className={canGenerate ? "transition-transform group-hover:-rotate-12" : ""} />
                  Generate
                  <span className="border-l border-ink-950/25 pl-2.5 font-mono text-[10.5px] font-medium normal-case tracking-normal">POST /v1/video_generation</span>
                </button>
              </div>
            </div>
          </div>

          {!activeKey && (
            <a href="#keys" className="mt-3 flex items-center gap-2.5 border border-brass-500/40 bg-brass-900/30 px-4 py-3 text-[12.5px] text-brass-300 transition-colors hover:bg-brass-900/50">
              <IconKey size={14} />
              No API key active — requests will be rejected upstream. Add one in the Keys bay.
            </a>
          )}
        </div>

        {/* ============ inspector ============ */}
        <div className="xl:col-span-5">
          <div className="panel xl:sticky xl:top-24">
            <div className="hairline-b flex items-center justify-between px-5 py-3.5">
              <span className="panel-title">Inspector · live wire format</span>
              <span className="font-mono text-[10px] tracking-wider text-dim">{host}</span>
            </div>
            <div className="p-4">
              <div className="mb-3 flex border border-line-soft bg-ink-950/60 p-1">
                {(
                  [
                    ["curl", "cURL"],
                    ["body", "JSON body"],
                    ["poll", "Poll task"],
                    ["resp", "Response"],
                  ] as const
                ).map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`btn-press flex-1 px-2 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors ${
                      tab === t ? "bg-ink-700 text-steel-300" : "text-dim hover:text-paper"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <CodeBlock
                code={code}
                lang={tab === "curl" || tab === "poll" ? "curl" : "json"}
                label={
                  tab === "curl"
                    ? "POST /v1/video_generation"
                    : tab === "body"
                      ? "request body"
                      : tab === "poll"
                        ? "GET /v1/query/video_generation"
                        : "200 OK · application/json"
                }
              />
              <p className="mt-3 text-[11.5px] leading-relaxed text-dim">
                Create returns a <span className="font-mono text-mut">task_id</span> immediately, then poll the query endpoint until{" "}
                <span className="font-mono text-jade-400">Success</span> — the console on the left does exactly that against a local render rig.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
