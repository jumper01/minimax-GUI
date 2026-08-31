export type Mode = "t2v" | "i2v" | "director";
export type Region = "intl" | "cn";
export type TaskStatus = "Queueing" | "Preparing" | "Generating" | "Success" | "Fail";
export type Resolution = "768P" | "1080P";
export type Duration = 6 | 10;

export interface GenTask {
  id: string;
  taskId: string; // MiniMax-style numeric task id
  fileId?: string;
  mode: Mode;
  model: string;
  prompt: string;
  resolution: Resolution;
  duration: Duration;
  promptOptimizer: boolean;
  camera?: string;
  firstFrame?: string; // image url (demo stand-in for base64 payload)
  status: TaskStatus;
  progress: number; // 0..100 inside Generating
  elapsed: number; // simulated seconds processed
  polls: number;
  cost: number;
  imageUrl?: string;
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

export const MODELS: Record<Mode, { id: string; label: string; tag: string; base: number }[]> = {
  t2v: [
    { id: "video-01", label: "Hailuo Video-01", tag: "768P · flagship T2V", base: 10 },
    { id: "video-01-live", label: "Video-01-Live", tag: "live-action people", base: 12 },
    { id: "hailuo-02", label: "MiniMax-Hailuo-02", tag: "1080P · up to 10s", base: 18 },
  ],
  i2v: [
    { id: "i2v-01", label: "Hailuo I2V-01", tag: "first-frame animation", base: 12 },
    { id: "hailuo-02", label: "MiniMax-Hailuo-02", tag: "first / last frame", base: 18 },
  ],
  director: [
    { id: "T2V-01-Director", label: "T2V-01-Director", tag: "camera movement control", base: 14 },
  ],
};

export const CAMERA_MOVES = [
  "Zoom In",
  "Zoom Out",
  "Pan Left",
  "Pan Right",
  "Tilt Up",
  "Tilt Down",
  "Crane Up",
  "Crane Down",
  "Travelling",
  "Orbit",
];

export const STILLS = [
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

/* ---------------- helpers ---------------- */

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function genTaskId(): string {
  let s = "18";
  for (let i = 0; i < 17; i++) s += Math.floor(Math.random() * 10);
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

export function estimateCost(mode: Mode, model: string, res: Resolution, dur: Duration): number {
  const base = MODELS[mode].find((m) => m.id === model)?.base ?? 12;
  return base + (res === "1080P" ? 4 : 0) + (dur === 10 ? 6 : 0);
}

/* ---------------- request builders ---------------- */

export function buildBody(t: Pick<GenTask, "mode" | "model" | "prompt" | "resolution" | "duration" | "promptOptimizer" | "camera" | "firstFrame">): Record<string, unknown> {
  const body: Record<string, unknown> = { model: t.model, prompt: t.prompt };
  if (t.mode === "i2v") {
    body.first_frame_image = t.firstFrame
      ? "data:image/jpeg;base64,/9j/4AAQSkZJRg…(" + "A1b2".repeat(4) + "…)"
      : "<base64 image payload>";
  }
  if (t.mode === "director") {
    body.resolution = "768P";
    body.duration = 6;
    if (t.camera) body.camera_movement = t.camera;
  } else {
    body.resolution = t.resolution;
    body.duration = t.duration;
  }
  body.prompt_optimizer = t.promptOptimizer;
  return body;
}

export function buildCreateCurl(host: string, key: string, body: Record<string, unknown>): string {
  return [
    `curl -X POST 'https://${host}/v1/video_generation' \\`,
    `  -H 'Authorization: Bearer ${key}' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d '${JSON.stringify(body)}'`,
  ].join("\n");
}

export function buildQueryCurl(host: string, key: string, taskId: string): string {
  return [
    `curl 'https://${host}/v1/query/video_generation?task_id=${taskId}' \\`,
    `  -H 'Authorization: Bearer ${key}'`,
  ].join("\n");
}

export function sampleResponse(taskId: string): string {
  return JSON.stringify(
    {
      task_id: taskId,
      base_resp: { status_code: 0, status_msg: "success" },
      file_id: genFileId().slice(0, 16) + "…",
    },
    null,
    2
  );
}

export function sampleQueryResponse(taskId: string, fileId: string, fileUrl: string): string {
  return JSON.stringify(
    {
      task_id: taskId,
      base_resp: { status_code: 0, status_msg: "success" },
      file_id: fileId,
      file_url: fileUrl,
    },
    null,
    2
  );
}
