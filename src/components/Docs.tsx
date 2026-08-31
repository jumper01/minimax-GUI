import React from "react";
import { LEGACY_MODELS } from "../lib/api";
import { CodeBlock, IconClock, IconGlobe, IconKey, Reveal } from "./ui";

interface Param {
  name: string;
  type: string;
  req: boolean;
  desc: string;
}

function ParamTable({ rows }: { rows: Param[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left">
        <thead>
          <tr className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
            <th className="pb-2 pr-3 font-medium">field</th>
            <th className="pb-2 pr-3 font-medium">type</th>
            <th className="pb-2 pr-3 font-medium">req</th>
            <th className="pb-2 font-medium">notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name} className="border-t border-line-soft align-top transition-colors hover:bg-ink-800/40">
              <td className="py-2.5 pr-3 font-mono text-[11.5px] text-steel-300">{p.name}</td>
              <td className="py-2.5 pr-3 font-mono text-[11px] text-mut">{p.type}</td>
              <td className="py-2.5 pr-3">
                {p.req ? (
                  <span className="border border-brass-500/40 bg-brass-900/30 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-brass-300">yes</span>
                ) : (
                  <span className="font-mono text-[9px] uppercase tracking-wider text-dim">opt</span>
                )}
              </td>
              <td className="py-2.5 text-[12px] leading-relaxed text-mut">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointCard({
  method,
  path,
  title,
  desc,
  params,
  children,
  className,
  tone,
  badge,
}: {
  method: "POST" | "GET";
  path: string;
  title: string;
  desc: string;
  params: Param[];
  children?: React.ReactNode;
  className?: string;
  tone: "brass" | "steel" | "jade";
  badge?: string;
}) {
  const toneCls = tone === "brass" ? "text-brass-400 border-brass-500/50" : tone === "steel" ? "text-steel-400 border-steel-500/50" : "text-jade-400 border-jade-500/50";
  return (
    <Reveal className={className}>
      <div className="panel flex h-full flex-col">
        <div className="hairline-b flex flex-wrap items-center gap-2.5 px-5 py-3.5">
          <span className={`border px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wider ${toneCls}`}>{method}</span>
          <code className="font-mono text-[12px] text-paper/85">{path}</code>
          {badge && <span className="ml-auto border border-line-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-dim">{badge}</span>}
        </div>
        <div className="flex-1 space-y-4 p-5">
          <div>
            <h3 className="font-display text-[15px] font-bold text-paper">{title}</h3>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-mut">{desc}</p>
          </div>
          <ParamTable rows={params} />
          {children}
        </div>
      </div>
    </Reveal>
  );
}

const CREATE_CURL = `curl --request POST \\
  --url https://api.minimax.io/v2/video_generation \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
  "model": "MiniMax-H3",
  "content": [
    {
      "type": "text",
      "text": "Epic space-opera theatrical teaser…"
    }
  ],
  "resolution": "2K",
  "duration": 5,
  "ratio": "16:9"
}'`;

export function Docs() {
  return (
    <section id="endpoints" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <EndpointCard
          className="xl:col-span-7"
          tone="brass"
          badge="current · H3"
          method="POST"
          path="/v2/video_generation"
          title="Create video generation task"
          desc="Async by design: the API validates the multimodal content array, bills the job, and returns a task_id immediately. Multimodal input — text, frames and references — all travels in content[]."
          params={[
            { name: "model", type: "string", req: true, desc: "MiniMax-H3 (768P/2K · 4–15s · T2V, I2V first/mid/last, R2V) or MiniMax-H3-Max (480P/768P · 5–15s · T2V, I2V first/last)." },
            { name: "content", type: "object[]", req: true, desc: "One non-empty text item is required. Add image_url items with role first_frame / last_frame / reference_image (≤ 9), or reference_video / reference_audio for R2V." },
            { name: "resolution", type: "string", req: true, desc: "480P · 768P · 2K — availability depends on the model. H3-Max defaults to 768P and cannot do 2K." },
            { name: "duration", type: "int", req: true, desc: "Seconds of footage. H3: 4–15 · H3-Max: 5–15." },
            { name: "ratio", type: "string", req: false, desc: "21:9 · 16:9 · 4:3 · 1:1 · 3:4 · 9:16 · adaptive. Required (and never adaptive) for T2V; ignored for I2V — frames decide the frame." },
            { name: "callback_url", type: "string", req: false, desc: "Push endpoint for status changes. Must echo the challenge verification within 3s." },
          ]}
        >
          <CodeBlock lang="curl" label="text-to-video · t2va" code={CREATE_CURL} />
        </EndpointCard>

        <EndpointCard
          className="xl:col-span-5"
          tone="steel"
          badge="poll"
          method="GET"
          path="/v2/query/video_generation/{task_id}"
          title="Query task"
          desc="Poll with the task_id from create. On success the task object carries content.url — a signed CDN link to the MP4 — plus usage accounting and the real ratio."
          params={[{ name: "task_id", type: "string · path", req: true, desc: "Numeric id returned by the create call." }]}
        >
          <CodeBlock
            lang="json"
            label='200 · status "succeeded"'
            code={JSON.stringify(
              {
                task: {
                  id: "424010985738629",
                  model: "MiniMax-H3",
                  status: "succeeded",
                  content: { url: "https://cdn.hailuoai.com/…/final.mp4" },
                  resolution: "2K",
                  duration: 5,
                  usage: { total_seconds: 5, output_seconds: 5, input_image_count: 0 },
                  ratio: "16:9",
                  modality: "video",
                },
              },
              null,
              2
            )}
          />
          <div className="border border-line-soft bg-ink-950/60 p-3.5">
            <div className="mb-2 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-steel-400" /> task status lifecycle
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] tracking-wide">
              {["queued", "running", "succeeded"].map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`border px-1.5 py-0.5 ${s === "succeeded" ? "border-jade-500/50 text-jade-300" : "border-line text-mut"}`}>{s}</span>
                  {i < 2 && <span className="text-dim">→</span>}
                </React.Fragment>
              ))}
              <span className="ml-1 border border-rec-500/40 px-1.5 py-0.5 text-rec-400">failed ⟲</span>
              <span className="border border-line-soft px-1.5 py-0.5 text-dim">cancelled</span>
            </div>
          </div>
        </EndpointCard>

        <EndpointCard
          className="xl:col-span-5"
          tone="jade"
          badge="legacy · v1"
          method="POST"
          path="/v1/video_generation"
          title="The v1 surface (retired lineup)"
          desc="The original Hailuo generation endpoints. Flat prompt field, base64 first_frame_image, Director camera moves — superseded by the H3 content[] schema above."
          params={LEGACY_MODELS.map((m) => ({ name: m.id, type: "model", req: false, desc: m.note }))}
        >
          <div className="border border-line-soft bg-ink-950/60 p-3.5 font-mono text-[10.5px] leading-relaxed text-dim">
            v1 body keys: <span className="text-steel-300">prompt · first_frame_image · camera_movement · prompt_optimizer</span> — none of these exist in v2.
          </div>
        </EndpointCard>

        <Reveal className="xl:col-span-7" delay={80}>
          <div className="grid h-full gap-5 sm:grid-cols-2">
            <div className="panel flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <IconKey size={15} className="text-brass-400" />
                <h3 className="font-display text-[14px] font-bold text-paper">Authentication</h3>
              </div>
              <p className="text-[12.5px] leading-relaxed text-mut">
                Every call carries a bearer token. Keys are minted per project in the platform console and can be revoked without touching code.
              </p>
              <pre className="code-block mt-3.5 border border-line-soft bg-ink-950/70 p-3 text-[11px]">
                <span className="tok-flag">Authorization:</span> <span className="tok-str">Bearer {"<YOUR_API_KEY>"}</span>
              </pre>
              <div className="mt-4 border-t border-line-soft pt-3.5">
                <div className="mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">error codes you will actually meet</div>
                <ul className="space-y-1.5 font-mono text-[10.5px] text-mut">
                  <li><span className="text-brass-300">400</span> · 2013 — content must include a non-empty text item</li>
                  <li><span className="text-brass-300">402</span> · 1008 — insufficient balance</li>
                  <li><span className="text-brass-300">422</span> · 1026 — sensitive content in description</li>
                  <li><span className="text-brass-300">429</span> · 1002 — rate limit, retry later</li>
                </ul>
              </div>
            </div>
            <div className="panel flex flex-col p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <IconGlobe size={15} className="text-steel-400" />
                <h3 className="font-display text-[14px] font-bold text-paper">Two regions</h3>
              </div>
              <ul className="space-y-2.5 text-[12.5px] leading-relaxed text-mut">
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-steel-400" />
                  <span><code className="font-mono text-[11.5px] text-steel-300">api.minimax.io</code> — international traffic, billed in USD.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brass-400" />
                  <span><code className="font-mono text-[11.5px] text-brass-300">api.minimaxi.com</code> — mainland China endpoint. Note the extra <em>i</em>.</span>
                </li>
              </ul>
              <div className="mt-4 flex items-start gap-2.5 border-t border-line-soft pt-3.5 text-[12.5px] leading-relaxed text-mut">
                <IconClock size={14} className="mt-0.5 shrink-0 text-jade-400" />
                <span>A 2K H3 render takes minutes server-side — hence the async task flow. Keep polls polite: every 3–5s, or wire a callback.</span>
              </div>
              <p className="mt-auto border-t border-line-soft pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">flip the toggle in the masthead to re-target every snippet</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
