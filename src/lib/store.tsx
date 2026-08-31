import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiKey,
  GenTask,
  Mode,
  Ratio,
  Region,
  Resolution,
  TaskStatus,
  WireLine,
  API,
  contentUrlFor,
  estimateCost,
  genFileId,
  genTaskId,
  pickStill,
  uid,
} from "./api";

export interface Toast {
  id: string;
  kind: "ok" | "warn" | "err";
  msg: string;
}

export interface ComposeInput {
  mode: Mode;
  model: string;
  prompt: string;
  resolution: Resolution;
  duration: number;
  ratio: Ratio;
  firstFrame?: string;
  lastFrame?: string;
  refs?: string[];
}

interface AppState {
  tasks: GenTask[];
  keys: ApiKey[];
  activeKeyId: string | null;
  region: Region;
  creditsUsed: number;
  wire: WireLine[];
  toasts: Toast[];
  running: number;
  generate: (input: ComposeInput) => GenTask | null;
  retry: (id: string) => void;
  removeTask: (id: string) => void;
  clearFinished: () => void;
  addKey: (name: string, key: string) => boolean;
  removeKey: (id: string) => void;
  setActiveKey: (id: string) => void;
  setRegion: (r: Region) => void;
  toast: (kind: Toast["kind"], msg: string) => void;
  dismissToast: (id: string) => void;
}

const Ctx = createContext<AppState | null>(null);

const LS_KEY = "mmx-motion-console-v3";
export const CREDITS_BUDGET = 500;

// simulated stage durations (seconds)
const QUEUE_TIME = 1.4;
const RUN_TIME = 6.5;

interface Persisted {
  tasks: GenTask[];
  keys: ApiKey[];
  activeKeyId: string | null;
  region: Region;
  creditsUsed: number;
}

const SPACE = "https://image.qwenlm.ai/generated-images/b4e31982-ddb8-417d-8290-b117e716dd79/_result.png";
const RAIL = "https://image.qwenlm.ai/generated-images/65ffefe0-4aab-483d-b5d3-5f90eea9aa3e/_result.png";
const DANCER = "https://image.qwenlm.ai/generated-images/e0b0b702-fa53-4578-a04b-c42d0d134d81/_result.png";
const FOREST = "https://image.qwenlm.ai/generated-images/8c9b1e20-9892-41d1-bde2-cc8aefe9ed79/_result.png";

function doneTask(partial: Partial<GenTask> & Pick<GenTask, "taskId" | "model" | "prompt" | "resolution" | "duration" | "ratio" | "mode">): GenTask {
  const createdAt = Date.now() - 1000 * 60 * (8 + Math.floor(Math.random() * 90));
  return {
    id: uid(),
    status: "succeeded",
    progress: 100,
    elapsed: QUEUE_TIME + RUN_TIME,
    polls: 6,
    cost: estimateCost(partial.model, partial.resolution, partial.duration),
    createdAt,
    finishedAt: createdAt + 1000 * (QUEUE_TIME + RUN_TIME + 2),
    imageUrl: pickStill(partial.prompt).url,
    contentUrl: contentUrlFor(partial.taskId),
    ...partial,
  };
}

function seed(): Persisted {
  const key: ApiKey = { id: uid(), name: "Sandbox key", key: "sk-sandbox-" + genFileId().slice(0, 20), createdAt: Date.now() };
  const tasks: GenTask[] = [
    doneTask({
      taskId: "424010985738629",
      model: "MiniMax-H3",
      mode: "t2v",
      prompt:
        "Epic space-opera theatrical teaser: a female captain stands alone before a massive observation window as the last fleet gathers and jumps away in a blinding flash, the bridge shaking, leaving her behind.",
      resolution: "2K",
      duration: 5,
      ratio: "16:9",
      imageUrl: SPACE,
    }),
    doneTask({
      taskId: "424011067281114",
      model: "MiniMax-H3",
      mode: "t2v",
      prompt: "A retro-futuristic silver monorail glides across an elevated rail over the amber desert at golden hour, long shadows stretching, dust glittering in the anamorphic flare.",
      resolution: "768P",
      duration: 10,
      ratio: "21:9",
      imageUrl: RAIL,
    }),
    doneTask({
      taskId: "424011212905487",
      model: "MiniMax-H3",
      mode: "i2v",
      prompt: "The dancer completes her spin, fabric snapping into a spiral, stage light flaring as she lands in a slow controlled collapse.",
      resolution: "768P",
      duration: 8,
      ratio: "adaptive",
      firstFrame: DANCER,
      imageUrl: DANCER,
    }),
    doneTask({
      taskId: "424011338450922",
      model: "MiniMax-H3",
      mode: "r2v",
      prompt: "A small glowing creature hops between ferns, leaving a faint teal light trail, mist curling around its feet in the dark forest.",
      resolution: "2K",
      duration: 12,
      ratio: "9:16",
      refs: [FOREST],
      imageUrl: FOREST,
    }),
  ];
  return { tasks, keys: [key], activeKeyId: key.id, region: "intl", creditsUsed: 84 };
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (p && Array.isArray(p.tasks) && Array.isArray(p.keys)) return p;
    }
  } catch {
    /* ignore */
  }
  return seed();
}

const ACTIVE: TaskStatus[] = ["queued", "running"];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const init = useMemo(load, []);
  const [tasks, setTasks] = useState<GenTask[]>(init.tasks);
  const [keys, setKeys] = useState<ApiKey[]>(init.keys);
  const [activeKeyId, setActiveKeyIdState] = useState<string | null>(init.activeKeyId);
  const [region, setRegionState] = useState<Region>(init.region);
  const [creditsUsed, setCreditsUsed] = useState(init.creditsUsed);
  const [wire, setWire] = useState<WireLine[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;

  /* ---------- persistence ---------- */
  useEffect(() => {
    const data: Persisted = { tasks, keys, activeKeyId, region, creditsUsed };
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [tasks, keys, activeKeyId, region, creditsUsed]);

  /* ---------- helpers ---------- */
  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = uid();
    setToasts((t) => [...t.slice(-3), { id, kind, msg }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const dismissToast = useCallback((id: string) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  /* ---------- lifecycle engine (simulated v2 task flow) ---------- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      const now = Date.now();
      const current = tasksRef.current;
      if (!current.some((t) => ACTIVE.includes(t.status))) return;

      const events: Omit<WireLine, "t">[] = [];
      const next = current.map((t) => {
        if (!ACTIVE.includes(t.status)) return t;
        const dt = 0.5;
        const elapsed = t.elapsed + dt;

        let status: TaskStatus = t.status;
        let progress = t.progress;
        let polls = t.polls;
        let imageUrl = t.imageUrl;
        let contentUrl = t.contentUrl;
        let error = t.error;
        let finishedAt = t.finishedAt;
        let ratio = t.ratio;

        const short = t.taskId.slice(0, 6) + "…";
        const path = API.query(short);

        if (elapsed < QUEUE_TIME) {
          status = "queued";
          if (t.status !== "queued") {
            polls += 1;
            events.push({ method: "GET", path, status: 200, note: "status: queued" });
          }
        } else if (elapsed < QUEUE_TIME + RUN_TIME) {
          status = "running";
          progress = Math.min(99, Math.round(((elapsed - QUEUE_TIME) / RUN_TIME) * 100));
          if (t.status === "queued") {
            polls += 1;
            events.push({ method: "GET", path, status: 200, note: "status: running" });
          } else if (Math.floor(progress / 25) > Math.floor(t.progress / 25) && progress < 99) {
            polls += 1;
            events.push({ method: "GET", path, status: 200, note: `status: running · ${progress}%` });
          }
        } else {
          const fail = parseInt(t.taskId.slice(-2), 10) % 9 === 0 && !t.imageUrl;
          if (fail) {
            status = "failed";
            error = "generation_error — frame scheduler timed out (E-4002). Retry, or shorten duration / resolution.";
            polls += 1;
            events.push({ method: "GET", path, status: 200, note: "status: failed" });
          } else {
            status = "succeeded";
            progress = 100;
            imageUrl = imageUrl ?? (t.refs?.[0] || t.firstFrame || pickStill(t.prompt).url);
            contentUrl = contentUrl ?? contentUrlFor(t.taskId);
            if (ratio === "adaptive" && t.mode !== "i2v") ratio = "16:9";
            polls += 1;
            events.push({ method: "GET", path, status: 200, note: "status: succeeded · content.url ready" });
          }
          finishedAt = now;
        }

        return { ...t, elapsed, status, progress, polls, imageUrl, contentUrl, error, finishedAt, ratio };
      });

      if (events.length) setWire((w) => [...w, ...events.map((e) => ({ ...e, t: Date.now() }))].slice(-48));
      setTasks(next);
    }, 500);
    return () => window.clearInterval(iv);
  }, []);

  /* ---------- actions ---------- */
  const generate = useCallback(
    (input: ComposeInput): GenTask | null => {
      const cost = estimateCost(input.model, input.resolution, input.duration);
      if (creditsUsed + cost > CREDITS_BUDGET) {
        toast("err", `Insufficient credits — needs ${cost}, ${CREDITS_BUDGET - creditsUsed} remaining this cycle.`);
        return null;
      }
      // i2v ratio is always adaptive server-side
      const ratio: Ratio = input.mode === "i2v" ? "adaptive" : input.ratio;
      const task: GenTask = {
        id: uid(),
        taskId: genTaskId(),
        mode: input.mode,
        model: input.model,
        prompt: input.prompt,
        resolution: input.resolution,
        duration: input.duration,
        ratio,
        firstFrame: input.mode === "i2v" ? input.firstFrame : undefined,
        lastFrame: input.mode === "i2v" ? input.lastFrame : undefined,
        refs: input.mode === "r2v" ? input.refs : undefined,
        status: "queued",
        progress: 0,
        elapsed: 0,
        polls: 0,
        cost,
        createdAt: Date.now(),
      };
      setTasks((ts) => [task, ...ts].slice(0, 40));
      setCreditsUsed((c) => c + cost);
      setWire((w) =>
        [...w, { t: Date.now(), method: "POST" as const, path: API.create, status: 200, note: `task_id ${task.taskId.slice(0, 6)}… · ${task.model}` }].slice(-48)
      );
      toast("ok", `Task created on ${task.model} — ${task.duration}s · ${task.resolution} · ~${cost} credits`);
      return task;
    },
    [creditsUsed, toast]
  );

  const retry = useCallback(
    (id: string) => {
      setTasks((ts) =>
        ts.map((t) =>
          t.id === id
            ? { ...t, status: "queued" as TaskStatus, progress: 0, elapsed: 0, polls: 0, error: undefined, taskId: genTaskId(), contentUrl: undefined, finishedAt: undefined, createdAt: Date.now() }
            : t
        )
      );
      setWire((w) => [...w, { t: Date.now(), method: "POST" as const, path: API.create, status: 200, note: "retry · fresh task_id issued" }].slice(-48));
      toast("ok", "Task re-created with a fresh task_id");
    },
    [toast]
  );

  const removeTask = useCallback((id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks((ts) => ts.filter((t) => ACTIVE.includes(t.status)));
  }, []);

  const addKey = useCallback(
    (name: string, key: string): boolean => {
      if (key.trim().length < 12) {
        toast("err", "Key looks too short — MiniMax keys are long bearer tokens.");
        return false;
      }
      const k: ApiKey = { id: uid(), name: name.trim() || "Untitled key", key: key.trim(), createdAt: Date.now() };
      setKeys((ks) => [k, ...ks]);
      setActiveKeyIdState(k.id);
      toast("ok", `Key “${k.name}” stored & activated`);
      return true;
    },
    [toast]
  );

  const removeKey = useCallback(
    (id: string) => {
      setKeys((ks) => {
        const next = ks.filter((k) => k.id !== id);
        setActiveKeyIdState((cur) => (cur === id ? next[0]?.id ?? null : cur));
        return next;
      });
      toast("warn", "Key revoked from local storage");
    },
    [toast]
  );

  const setActiveKey = useCallback((id: string) => {
    setActiveKeyIdState(id);
  }, []);

  const setRegion = useCallback(
    (r: Region) => {
      setRegionState(r);
      toast("ok", r === "intl" ? "Region → International (api.minimax.io)" : "Region → China (api.minimaxi.com)");
    },
    [toast]
  );

  const running = tasks.filter((t) => ACTIVE.includes(t.status)).length;

  const value: AppState = {
    tasks,
    keys,
    activeKeyId,
    region,
    creditsUsed,
    wire,
    toasts,
    running,
    generate,
    retry,
    removeTask,
    clearFinished,
    addKey,
    removeKey,
    setActiveKey,
    setRegion,
    toast,
    dismissToast,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
