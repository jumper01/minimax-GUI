import { useMemo } from "react";
import { GenTask, STILLS, contentUrlFor, estimateCost, ratioToAspect } from "../lib/api";
import { useApp } from "../lib/store";
import { VideoPreview } from "./VideoPreview";
import { CopyChip, IconFilm } from "./ui";

const SHOWCASE_PROMPTS = [
  "Aerial drone sweep over a neon harbor city at dusk, cranes silhouetted in amber sodium light, teal water reflections.",
  "Macro shot of black ink blooming through water like smoke, backlit with warm amber rim light, ultra slow motion.",
  "Night macro of a bioluminescent forest floor, a tiny teal creature in glowing moss, drifting mist.",
];

export function Library() {
  const app = useApp();

  const items = useMemo(() => {
    const done = app.tasks.filter((t) => t.status === "succeeded" && t.imageUrl);
    if (done.length) return done;
    // safety net so the screening room is never empty
    return STILLS.slice(1, 4).map((s, i): GenTask => {
      const taskId = "42401" + String(204117000000 + i * 7919).slice(0, 10);
      const duration = [10, 6, 12][i];
      const resolution = (["768P", "2K", "768P"] as const)[i];
      const ratio = (["21:9", "1:1", "9:16"] as const)[i];
      const createdAt = Date.now() - (i + 1) * 3600_000;
      return {
        id: "showcase-" + s.id,
        taskId,
        mode: "t2v",
        model: "MiniMax-H3",
        prompt: SHOWCASE_PROMPTS[i],
        resolution,
        duration,
        ratio,
        status: "succeeded",
        progress: 100,
        elapsed: 8,
        polls: 5,
        cost: estimateCost("MiniMax-H3", resolution, duration),
        imageUrl: s.url,
        contentUrl: contentUrlFor(taskId),
        createdAt,
        finishedAt: createdAt + 9400,
      };
    });
  }, [app.tasks]);

  return (
    <section id="library" className="scroll-mt-24">
      <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
        {items.map((t, i) => (
          <article
            key={t.id}
            className="group panel mb-5 flex break-inside-avoid flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-line hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)]"
          >
            <div className="p-2.5 pb-0">
              <VideoPreview task={t} variant={i} />
            </div>
            <div className="flex flex-1 flex-col gap-2.5 p-4">
              <div className="flex items-center justify-between gap-2 font-mono text-[9.5px] uppercase tracking-[0.16em] text-dim">
                <span className="flex items-center gap-1.5">
                  <IconFilm size={11} className="text-brass-500" />
                  reel {String(items.length - i).padStart(2, "0")}
                </span>
                <span>{t.model.replace("MiniMax-", "")} · {t.duration}s</span>
              </div>
              <p className="text-[12.5px] leading-relaxed text-paper/85">{t.prompt}</p>
              <div className="flex flex-wrap gap-1">
                <span className="border border-line-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mut">{t.resolution}</span>
                <span className="border border-line-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-mut" title={ratioToAspect(t.ratio)}>
                  {t.ratio}
                </span>
                <span className="border border-line-soft px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-steel-300">{t.mode}</span>
              </div>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <CopyChip text={t.contentUrl ?? ""} short={`content.url · …${(t.contentUrl ?? "").slice(-14)}`} />
                <span className="font-mono text-[10px] tabular-nums text-dim">{t.cost} cr</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
