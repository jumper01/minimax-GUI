import { useState } from "react";
import { fmtAgo, maskKey } from "../lib/api";
import { useApp } from "../lib/store";
import { CopyChip, IconKey, IconTrash } from "./ui";

export function Keys() {
  const app = useApp();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [revealed, setRevealed] = useState<string | null>(null);

  return (
    <section id="keys" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="panel xl:col-span-7">
          <div className="hairline-b flex items-center justify-between px-5 py-3.5">
            <span className="panel-title">Key bay · bearer tokens</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-dim">{app.keys.length} stored locally</span>
          </div>

          {app.keys.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
              <IconKey size={28} className="text-dim" />
              <p className="max-w-sm text-[13px] leading-relaxed text-mut">
                The bay is empty — every request upstream will 401. Mint a key in the MiniMax platform console and paste it here.
              </p>
            </div>
          ) : (
            <ul>
              {app.keys.map((k) => {
                const active = k.id === app.activeKeyId;
                return (
                  <li key={k.id} className={`hairline-b flex flex-wrap items-center gap-3 px-5 py-4 last:border-b-0 transition-colors ${active ? "bg-brass-900/15" : "hover:bg-ink-800/30"}`}>
                    <button
                      onClick={() => app.setActiveKey(k.id)}
                      className="btn-press group flex items-center gap-3 text-left"
                      title="Set as active key"
                    >
                      <span className={`relative flex h-4 w-4 items-center justify-center border transition-colors ${active ? "border-brass-500" : "border-line group-hover:border-mut"}`}>
                        {active && <span className="h-2 w-2 bg-brass-500" />}
                      </span>
                      <span>
                        <span className="block text-[13.5px] font-medium text-paper">
                          {k.name}
                          {active && <span className="ml-2 border border-brass-500/40 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-brass-300">active</span>}
                        </span>
                        <span className="mt-0.5 block font-mono text-[11px] text-dim">added {fmtAgo(k.createdAt)}</span>
                      </span>
                    </button>

                    <div className="ml-auto flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setRevealed(revealed === k.id ? null : k.id)}
                        className="btn-press border border-line-soft px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-mut transition-colors hover:border-steel-500/50 hover:text-steel-300"
                      >
                        {revealed === k.id ? "hide" : "reveal"}
                      </button>
                      <CopyChip text={k.key} short={revealed === k.id ? k.key : maskKey(k.key)} />
                      <button
                        onClick={() => app.removeKey(k.id)}
                        className="btn-press border border-line-soft p-1.5 text-dim transition-colors hover:border-rec-500/50 hover:text-rec-400"
                        title="Revoke key"
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="xl:col-span-5">
          <div className="panel h-full">
            <div className="hairline-b px-5 py-3.5">
              <span className="panel-title">Mint new key</span>
            </div>
            <form
              className="space-y-4 p-5"
              onSubmit={(e) => {
                e.preventDefault();
                if (app.addKey(name, key)) {
                  setName("");
                  setKey("");
                }
              }}
            >
              <div>
                <label className="panel-title mb-1.5 block" htmlFor="key-name">Label</label>
                <input
                  id="key-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. prod-renderer, staging-bot"
                  className="w-full border border-line-soft bg-ink-950/60 px-3.5 py-2.5 text-[13px] text-paper placeholder:text-dim transition-colors focus:border-brass-500/60 focus:outline-none"
                />
              </div>
              <div>
                <label className="panel-title mb-1.5 block" htmlFor="key-val">Bearer token</label>
                <input
                  id="key-val"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="eyJhbGciOiJSUzI1NiIs…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full border border-line-soft bg-ink-950/60 px-3.5 py-2.5 font-mono text-[12px] text-paper placeholder:text-dim transition-colors focus:border-brass-500/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="btn-press w-full bg-ink-750 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.16em] text-paper transition-colors hover:bg-ink-700 hover:text-brass-300"
              >
                store &amp; set active
              </button>
              <p className="border-t border-line-soft pt-3.5 text-[11.5px] leading-relaxed text-dim">
                Keys never leave this browser — they persist in <span className="font-mono text-mut">localStorage</span> only, and snippets above show them masked. Rotate anything you paste into a public demo.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
