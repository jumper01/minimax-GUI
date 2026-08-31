import { useMemo } from "react";
import { GenTask, STILLS } from "../lib/api";
import { useApp } from "../lib/store";
import { VideoPreview } from "./VideoPreview";
import { CopyChip, IconFilm } from "./ui";

const SHOWCASE_PROMPTS = [
  "Aerial drone sweep over a neon harbor city at dusk, cranes silhouetted in amber sodium light, teal water reflections.",
  "Retro-futuristic silver monorail crossing the amber desert at golden hour, dust glittering in an anamorphic flare.",
  "Night macro of a bioluminescent forest floor, a tiny teal creature in glowing moss, drifting mist.",
];

export function Library() {
  const app = useApp();

  const items = useMemo(() => {
    const done = app.tasks.filter((t) => t.status === "Success" && t.imageUrl);
    if (done.length) return done;
    // seed a showcase reel so the screening room is never empty
    return STILLS.slice(0, 3).map((s, i): GenTask => ({
      id: "showcase-" + s.id,
      taskId: "18" + String(2041170000000 + i * 7919).slice(0, 13),
      fileId: "f" + s.id + "c4d9e2a7b1f06538d9c2e4a7b1f06538",
      mode: i === 1 ? "director" : "t2v",
      model: i === 1 ? "T2V-01-Director" : "video-01",
      prompt: SHOWCASE_PROMPTS[i],
      resolution: i === 0 ? "1080P" : "768P",
      duration: i === 2 ? 10 : 6,
      promptOptimizer: true,
      camera: i === 1 ? "Travelling" : undefined,
      status: "Success",
      progress: 100,
      elapsed: 10,
      polls: 5,
      cost: 14,
      imageUrl: s.url,
      createdAt: Date.now() - (i + 1) * 3600_000,
      finishedAt: Date.now() - (i + 1) * 3600_000 + 9400,
    }));
  }, [app.tasks]);

  return (
    <section id="library" className="scroll-mt-24">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {items.map((t, i) => (
          <article
            key={t.id}
            className={`group panel flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-line hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.9)] ${
              i === 0 ? "md:col-span-2 xl:col-span-2 xl:row-span-1" : ""
            }`}
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
                <span>{t.model} · {t.resolution} · {t.duration}s</span>
              </div>
              <p className="line-clamp-2 text-[12.5px] leading-relaxed text-paper/85">{t.prompt}</p>
              <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                <CopyChip text={t.fileId ?? ""} short={`file_id ${t.fileId?.slice(0, 10)}…`} />
                <span className="font-mono text-[10px] tabular-nums text-dim">{t.cost} cr</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
