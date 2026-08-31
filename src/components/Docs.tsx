import React from "react";
import { CodeBlock, IconGlobe, IconKey, Reveal } from "./ui";

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
}: {
  method: "POST" | "GET";
  path: string;
  title: string;
  desc: string;
  params: Param[];
  children?: React.ReactNode;
  className?: string;
  tone: "brass" | "steel" | "jade";
}) {
  const toneCls = tone === "brass" ? "text-brass-400 border-brass-500/50" : tone === "steel" ? "text-steel-400 border-steel-500/50" : "text-jade-400 border-jade-500/50";
  return (
    <Reveal className={className}>
      <div className="panel flex h-full flex-col">
        <div className="hairline-b flex flex-wrap items-center gap-2.5 px-5 py-3.5">
          <span className={`border px-2 py-0.5 font-mono text-[10.5px] font-semibold tracking-wider ${toneCls}`}>{method}</span>
          <code className="font-mono text-[12px] text-paper/85">{path}</code>
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

export function Docs() {
  return (
    <section id="endpoints" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <EndpointCard
          className="xl:col-span-7"
          tone="brass"
          method="POST"
          path="/v1/video_generation"
          title="Create video generation task"
          desc="Async by design: the API validates the job, bills it, and immediately returns a task_id. Everything after this call is polling."
          params={[
            { name: "model", type: "string", req: true, desc: "video-01 · video-01-live · i2v-01 · T2V-01-Director · MiniMax-Hailuo-02" },
            { name: "prompt", type: "string", req: true, desc: "Shot description, ≤ 500 chars. Chinese or English." },
            { name: "resolution", type: "string", req: false, desc: "768P or 1080P (Hailuo-02). Director locks to 768P." },
            { name: "duration", type: "int", req: false, desc: "6 or 10 seconds of footage at 25 fps." },
            { name: "prompt_optimizer", type: "bool", req: false, desc: "Server-side prompt expansion. Recommended for short prompts." },
            { name: "first_frame_image", type: "string", req: false, desc: "Base64 JPEG/PNG ≤ 10 MB — required for i2v-01." },
            { name: "camera_movement", type: "string", req: false, desc: "Director only: Pan / Tilt / Zoom / Crane / Travelling / Orbit." },
          ]}
        />

        <EndpointCard
          className="xl:col-span-5"
          tone="steel"
          method="GET"
          path="/v1/query/video_generation"
          title="Query task status"
          desc="Poll with ?task_id=… every few seconds. Status walks Queueing → Preparing → Generating → Success, or lands on Fail with a reason."
          params={[
            { name: "task_id", type: "string", req: true, desc: "From the create response." },
          ]}
        >
          <CodeBlock
            lang="json"
            label='200 · status "Success"'
            code={JSON.stringify(
              {
                task_id: "1820471123900543123",
                base_resp: { status_code: 0, status_msg: "success" },
                file_id: "c4d9e2a7b1f06538…",
                file_url: "https://cdn…/hailuo_01.mp4?auth_key=…",
              },
              null,
              2
            )}
          />
        </EndpointCard>

        <EndpointCard
          className="xl:col-span-5"
          tone="jade"
          method="GET"
          path="/v1/files/retrieve"
          title="Retrieve file metadata"
          desc="file_url expires after 24 hours. Call retrieve with the file_id to mint a fresh signed download_url whenever you need the MP4 again."
          params={[
            { name: "file_id", type: "string", req: true, desc: "Issued with a successful task." },
          ]}
        >
          <div className="border border-line-soft bg-ink-950/60 p-3.5">
            <div className="mb-2 flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-dim">
              <span className="h-1.5 w-1.5 rounded-full bg-jade-400" /> task state machine
            </div>
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10.5px] tracking-wide">
              {["Queueing", "Preparing", "Generating", "Success"].map((s, i) => (
                <React.Fragment key={s}>
                  <span className={`border px-1.5 py-0.5 ${s === "Success" ? "border-jade-500/50 text-jade-300" : "border-line text-mut"}`}>{s}</span>
                  {i < 3 && <span className="text-dim">→</span>}
                </React.Fragment>
              ))}
              <span className="ml-1 border border-rec-500/40 px-1.5 py-0.5 text-rec-400">Fail ⟲ retry</span>
            </div>
          </div>
        </EndpointCard>

        <Reveal className="xl:col-span-7" delay={80}>
          <div className="grid h-full gap-5 sm:grid-cols-2">
            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2.5">
                <IconKey size={15} className="text-brass-400" />
                <h3 className="font-display text-[14px] font-bold text-paper">Authentication</h3>
              </div>
              <p className="text-[12.5px] leading-relaxed text-mut">
                Every call carries a bearer token. Keys are minted per project in the platform console and can be scoped or revoked without touching code.
              </p>
              <pre className="code-block mt-3.5 border border-line-soft bg-ink-950/70 p-3 text-[11px]">
                <span className="tok-flag">Authorization:</span> <span className="tok-str">Bearer {"<YOUR_API_KEY>"}</span>
              </pre>
            </div>
            <div className="panel p-5">
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
              <p className="mt-3 border-t border-line-soft pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-dim">flip the toggle in the masthead to re-target every snippet</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
