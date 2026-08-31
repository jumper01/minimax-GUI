/* ------------------------------------------------------------------ */
/* MiniMax video generation API — v2 surface (H3 generation engine)    */
/* POST https://api.minimax.io/v2/video_generation                     */
/* GET  https://api.minimax.io/v2/query/video_generation/{task_id}     */
/* ------------------------------------------------------------------ */

export type Mode = "t2v" | "i2v" | "r2v";
export type Region = "intl" | "cn";
export type TaskStatus = "queued" | "running" | "succeeded" | "failed";
export type Resolution = "480P" | "768P" | "2K";
export type Ratio = "adaptive" | "21:9" | "16:9" | "4:3" | "1:1" | "3:4" | "9:16";
export type FrameRole = "first_frame" | "last_frame" | "reference_image";

export interface ContentItem {
  type: "text" | "image_url";
  text?: string;
  role?: FrameRole;
  image_url?: { url: string };
}

export interface GenTask {
  id: string;
  taskId: string; // numeric id, e.g. "424010985738629"
  mode: Mode;
  model: string;
  prompt: string;
  resolution: Resolution;
  duration: number; // 4..15 seconds
  ratio: Ratio; // i2v is always "adaptive"
  firstFrame?: string; // image url · role=first_frame
  lastFrame?: string; // image url · role=last_frame
  refs?: string[]; // image urls · role=reference_image
  status: TaskStatus;
  progress: number; // 0..100 inside running
  elapsed: number; // simulated seconds processed
  polls: number;
  cost: number; // simulated credits
  imageUrl?: string; // preview stand-in for the generated frame
  contentUrl?: string; // task.content.url on success
  error?: string;
  createdAt: number;
  finishedAt?: number;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: number;
}

export interface WireLine {
  t: number;
  method: "POST" | "GET";
  path: string;
  status: number;
  note: string;
}

export const REGION_HOST: Record<Region, string> = {
  intl: "api.minimax.io",
  cn: "api.minimaxi.com",
};

export const API = {
  create: "/v2/video_generation",
  query: (taskId: string) => `/v2/query/video_generation/${taskId}`,
};

/* ------------------------- model catalog ------------------------- */

export interface ModelInfo {
  id: string;
  short: string;
  tag: string;
  resolutions: Resolution[];
  durMin: number;
  durMax: number;
  modes: Mode[];
  features: string[];
  creditPerSec: Record<Resolution, number>;
}

export const MODEL_LIST: ModelInfo[] = [
  {
    id: "MiniMax-H3",
    short: "H3",
    tag: "flagship H3 generation engine",
    resolutions: ["768P", "2K"],
    durMin: 4,
    durMax: 15,
    modes: ["t2v", "i2v", "r2v"],
    features: ["text-to-video", "image-to-video · first / middle / last frame", "reference-to-video · image / video / audio", "768P · 2K output"],
    creditPerSec: { "480P": 2.4, "768P": 3.5, "2K": 6 },
  },
  {
    id: "MiniMax-H3-Max",
    short: "H3·MAX",
    tag: "fast variant · quick turnaround",
    resolutions: ["480P", "768P"],
    durMin: 5,
    durMax: 15,
    modes: ["t2v", "i2v"],
    features: ["text-to-video", "image-to-video · first / last frame", "480P · 768P output", "no middle frames · no reference mode"],
    creditPerSec: { "480P": 1.6, "768P": 2.4, "2K": 0 },
  },
];

export function modelById(id: string): ModelInfo {
  return MODEL_LIST.find((m) => m.id === id) ?? MODEL_LIST[0];
}

export const RATIOS: Exclude<Ratio, "adaptive">[] = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"];

export const LEGACY_MODELS = [
  { id: "video-01", note: "768P · 6s · T2V flagship of the v1 era" },
  { id: "video-01-live", note: "live-action people · 768P" },
  { id: "i2v-01", note: "first-frame animation · 720P" },
  { id: "T2V-01-Director", note: "camera_movement control · 15 movements" },
  { id: "MiniMax-Hailuo-02", note: "1080P · up to 10s · first / last frame" },
];

export function ratioToAspect(r: Ratio): string {
  switch (r) {
    case "21:9": return "21 / 9";
    case "4:3": return "4 / 3";
    case "1:1": return "1 / 1";
    case "3:4": return "3 / 4";
    case "9:16": return "9 / 16";
    default: return "16 / 9";
  }
}

/* ------------------------- demo media ------------------------- */

export const STILLS = [
  {
    id: "space",
    url: "https://image.qwenlm.ai/generated-images/b4e31982-ddb8-417d-8290-b117e716dd79/_result.png",
    label: "Fleet jump",
    keys: ["space", "opera", "fleet", "captain", "window", "jump", "bridge", "sci-fi", "starship", "hyperspace"],
  },
  {
    id: "harbor",
    url: "https://image.qwenlm.ai/generated-images/0764fe62-7bcc-40a6-b666-bdbc1ba23417/_result.png",
    label: "Harbor dusk",
    keys: ["harbor", "city", "aerial", "drone", "crane", "neon", "water", "port", "dusk"],
  },
  {
    id: "ink",
    url: "https://image.qwenlm.ai/generated-images/4f64538a-e909-4181-90c4-648d76adc5d1/_result.png",
    label: "Ink bloom",
    keys: ["ink", "macro", "smoke", "bloom", "water", "gold", "particle", "abstract"],
  },
  {
    id: "rail",
    url: "https://image.qwenlm.ai/generated-images/65ffefe0-4aab-483d-b5d3-5f90eea9aa3e/_result.png",
    label: "Desert rail",
    keys: ["train", "rail", "desert", "monorail", "sunset", "golden", "retro", "track"],
  },
  {
    id: "dancer",
    url: "https://image.qwenlm.ai/generated-images/e0b0b702-fa53-4578-a04b-c42d0d134d81/_result.png",
    label: "Stage dancer",
    keys: ["dancer", "dance", "stage", "fabric", "studio", "spin", "light", "human"],
  },
  {
    id: "forest",
    url: "https://image.qwenlm.ai/generated-images/8c9b1e20-9892-41d1-bde2-cc8aefe9ed79/_result.png",
    label: "Glow forest",
    keys: ["forest", "glow", "creature", "moss", "bioluminescent", "night", "fern", "mist"],
  },
];

export const PROMPT_IDEAS: { label: string; prompt: string }[] = [
  {
    label: "Space-opera teaser",
    prompt:
      "Epic space-opera theatrical teaser: a female captain stands alone before a massive observation window as the last fleet gathers and jumps away in a blinding flash, the bridge shaking, leaving her behind.",
  },
  {
    label: "Harbor flyover",
    prompt:
      "Aerial drone sweep over a neon harbor city at dusk, container cranes silhouetted against amber sodium light, teal reflections rippling on dark water, slow cinematic descent.",
  },
  {
    label: "Ink in water",
    prompt:
      "Macro shot of black ink blooming through water like smoke, backlit with warm amber rim light, golden particles suspended, ultra slow motion, shallow depth of field.",
  },
  {
    label: "Desert monorail",
    prompt:
      "A retro-futuristic silver monorail glides across an elevated rail over the amber desert at golden hour, long shadows stretching, dust glittering in the anamorphic flare.",
  },
  {
    label: "Dancer in haze",
    prompt:
      "A contemporary dancer mid-spin in a dark studio, flowing fabric frozen in volumetric amber stage light, slight motion blur, chiaroscuro shadows swallowing the frame.",
  },
  {
    label: "Bioluminescent fern",
    prompt:
      "Night macro of a bioluminescent forest floor, a tiny teal creature peeking from glowing moss and ferns, drifting mist, cyan glimmers pulsing softly in the dark.",
  },
];

/* ------------------------- helpers ------------------------- */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function genTaskId(): string {
  // 15-digit numeric id like the docs example 424010985738629
  let s = String(1 + Math.floor(Math.random() * 8));
  for (let i = 0; i < 14; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export function genFileId(): string {
  const hex = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < 32; i++) s += hex[Math.floor(Math.random() * 16)];
  return s;
}

export function maskKey(key: string): string {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}

export function fmtClock(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-GB", { hour12: false });
}

export function fmtAgo(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

export function pickStill(prompt: string): (typeof STILLS)[number] {
  const p = prompt.toLowerCase();
  let best = STILLS[0];
  let bestScore = -1;
  for (const s of STILLS) {
    const score = s.keys.reduce((acc, k) => acc + (p.includes(k) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  if (bestScore <= 0) best = STILLS[Math.floor(Math.random() * STILLS.length)];
  return best;
}

export function contentUrlFor(taskId: string): string {
  const seed = genFileId().slice(0, 12);
  return `https://cdn.hailuoai.com/prod/v2/renders/${taskId.slice(0, 8)}/${seed}_denoise_final.mp4`;
}

export function estimateCost(model: string, resolution: Resolution, duration: number): number {
  const m = modelById(model);
  const per = m.creditPerSec[resolution] || 2.4;
  return Math.max(4, Math.round(per * duration));
}

/* ------------------------- request builders ------------------------- */

export function buildContent(input: {
  prompt: string;
  mode: Mode;
  firstFrame?: string;
  lastFrame?: string;
  refs?: string[];
}): ContentItem[] {
  const content: ContentItem[] = [{ type: "text", text: input.prompt }];
  if (input.mode === "i2v") {
    if (input.firstFrame) content.push({ type: "image_url", role: "first_frame", image_url: { url: input.firstFrame } });
    if (input.lastFrame) content.push({ type: "image_url", role: "last_frame", image_url: { url: input.lastFrame } });
  }
  if (input.mode === "r2v" && input.refs?.length) {
    for (const r of input.refs) content.push({ type: "image_url", role: "reference_image", image_url: { url: r } });
  }
  return content;
}

export function buildBody(input: {
  model: string;
  prompt: string;
  mode: Mode;
  resolution: Resolution;
  duration: number;
  ratio: Ratio;
  firstFrame?: string;
  lastFrame?: string;
  refs?: string[];
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    content: buildContent(input),
    resolution: input.resolution,
    duration: input.duration,
  };
  // i2v ratio is always adaptive (driven by the input image) — omit it.
  if (input.mode !== "i2v" && input.ratio !== "adaptive") body.ratio = input.ratio;
  return body;
}

export function buildCreateCurl(host: string, key: string, body: Record<string, unknown>): string {
  return [
    `curl --request POST \\`,
    `  --url https://${host}${API.create} \\`,
    `  --header 'Authorization: Bearer ${key}' \\`,
    `  --header 'Content-Type: application/json' \\`,
    `  --data '${JSON.stringify(body, null, 2)}'`,
  ].join("\n");
}

export function buildQueryCurl(host: string, key: string, taskId: string): string {
  return [
    `curl --request GET \\`,
    `  --url https://${host}${API.query(taskId)} \\`,
    `  --header 'Authorization: Bearer ${key}'`,
  ].join("\n");
}

export function sampleCreateResponse(taskId: string): string {
  return JSON.stringify({ task_id: taskId }, null, 2);
}

export function sampleQueryResponse(t: {
  taskId: string;
  model: string;
  resolution: Resolution;
  duration: number;
  ratio: Ratio;
  imageCount?: number;
}): string {
  const created = Math.floor(Date.now() / 1000) - 417;
  return JSON.stringify(
    {
      task: {
        id: t.taskId,
        model: t.model,
        status: "succeeded",
        created_at: created,
        updated_at: created + 417,
        content: { url: contentUrlFor(t.taskId) },
        resolution: t.resolution,
        duration: t.duration,
        usage: {
          total_seconds: t.duration,
          input_seconds: 0,
          output_seconds: t.duration,
          input_image_count: t.imageCount ?? 0,
        },
        ratio: t.ratio,
        task_type: "generation",
        modality: "video",
      },
    },
    null,
    2
  );
}
