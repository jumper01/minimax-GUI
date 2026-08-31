import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  ApiKey,
  GenTask,
  Region,
  TaskStatus,
  WireLine,
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
  mode: GenTask["mode"];
  model: string;
  prompt: string;
  resolution: GenTask["resolution"];
  duration: GenTask["duration"];
  promptOptimizer: boolean;
  camera?: string;
  firstFrame?: string;
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

const LS_KEY = "mmx-motion-console-v1";
const CREDITS_BUDGET = 500;

// stage durations in simulated seconds
const STAGE: Record<"Queueing" | "Preparing" | "Generating", number> = {
  Queueing: 1.4,
  Preparing: 2.0,
  Generating: 6.0,
};

interface Persisted {
  tasks: GenTask[];
  keys: ApiKey[];
  activeKeyId: string | null;
  region: Region;
  creditsUsed: number;
}

function seed(): Persisted {
  const key: ApiKey = { id: uid(), name: "Sandbox key", key: "sk-sandbox-" + genFileId().slice(0, 20), createdAt: Date.now() };
  return { tasks: [], keys: [key], activeKeyId: key.id, region: "intl", creditsUsed: 62 };
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

  const pushWire = useCallback((line: Omit<WireLine, "t">) => {
    setWire((w) => [...w.slice(-48), { ...line, t: Date.now() }]);
  }, []);

  /* ---------- lifecycle engine ---------- */
  useEffect(() => {
    const iv = window.setInterval(() => {
      const now = Date.now();
      const current = tasksRef.current;
      if (!current.some((t) => t.status === "Queueing" || t.status === "Preparing" || t.status === "Generating")) return;

      const events: Omit<WireLine, "t">[] = [];
      const next = current.map((t) => {
        if (t.status !== "Queueing" && t.status !== "Preparing" && t.status !== "Generating") return t;
        const dt = 0.5;
        const elapsed = t.elapsed + dt;
        const qEnd = STAGE.Queueing;
        const pEnd = qEnd + STAGE.Preparing;
        const gEnd = pEnd + STAGE.Generating;

        let status: TaskStatus = t.status;
        let progress = t.progress;
        let polls = t.polls;
        let imageUrl = t.imageUrl;
        let fileId = t.fileId;
        let error = t.error;
        let finishedAt = t.finishedAt;

        if (elapsed < qEnd) status = "Queueing";
        else if (elapsed < pEnd) {
          status = "Preparing";
          if (t.status === "Queueing") {
            polls += 1;
            events.push({ method: "GET", path: `/v1/query/video_generation?task_id=${t.taskId.slice(0, 10)}…`, status: 200, note: "Queueing" });
          }
        } else if (elapsed < gEnd) {
          status = "Generating";
          progress = Math.min(99, Math.round(((elapsed - pEnd) / STAGE.Generating) * 100));
          if (t.status === "Preparing") {
            polls += 1;
            events.push({ method: "GET", path: `/v1/query/video_generation?task_id=${t.taskId.slice(0, 10)}…`, status: 200, note: "Preparing" });
          }
          if (t.status !== "Generating" || Math.floor(progress / 25) > Math.floor(t.progress / 25)) {
            if (t.status === "Generating" && progress < 99) {
              polls += 1;
              events.push({ method: "GET", path: `/v1/query/video_generation?task_id=${t.taskId.slice(0, 10)}…`, status: 200, note: `Generating ${progress}%` });
            }
          }
        } else {
          // settle
          const fail = parseInt(t.taskId.slice(-2), 10) % 9 === 0 && !t.imageUrl;
          if (fail) {
            status = "Fail";
            error = "Render node returned E-4002: frame scheduler timeout. Retry or shorten duration.";
            polls += 1;
            events.push({ method: "GET", path: `/v1/query/video_generation?task_id=${t.taskId.slice(0, 10)}…`, status: 200, note: "Fail · E-4002" });
          } else {
            status = "Success";
            progress = 100;
            fileId = fileId ?? genFileId();
            imageUrl = imageUrl ?? pickStill(t.prompt).url;
            polls += 1;
            events.push({ method: "GET", path: `/v1/query/video_generation?task_id=${t.taskId.slice(0, 10)}…`, status: 200, note: "Success · file ready" });
            events.push({ method: "GET", path: `/v1/files/retrieve?file_id=${fileId.slice(0, 10)}…`, status: 200, note: "download_url issued" });
          }
          finishedAt = now;
        }

        return { ...t, elapsed, status, progress, polls, imageUrl, fileId, error, finishedAt };
      });

      if (events.length) setWire((w) => [...w, ...events.map((e) => ({ ...e, t: Date.now() }))].slice(-48));
      setTasks(next);
    }, 500);
    return () => window.clearInterval(iv);
  }, []);

  /* ---------- actions ---------- */
  const generate = useCallback(
    (input: ComposeInput): GenTask | null => {
      const cost = estimateCost(input.mode, input.model, input.resolution, input.duration);
      if (creditsUsed + cost > CREDITS_BUDGET) {
        toast("err", `Insufficient credits — needs ${cost}, ${CREDITS_BUDGET - creditsUsed} remaining this cycle.`);
        return null;
      }
      const task: GenTask = {
        id: uid(),
        taskId: genTaskId(),
        mode: input.mode,
        model: input.model,
        prompt: input.prompt,
        resolution: input.mode === "director" ? "768P" : input.resolution,
        duration: input.mode === "director" ? 6 : input.duration,
        promptOptimizer: input.promptOptimizer,
        camera: input.mode === "director" ? input.camera : undefined,
        firstFrame: input.mode === "i2v" ? input.firstFrame : undefined,
        status: "Queueing",
        progress: 0,
        elapsed: 0,
        polls: 0,
        cost,
        createdAt: Date.now(),
      };
      setTasks((ts) => [task, ...ts].slice(0, 40));
      setCreditsUsed((c) => c + cost);
      pushWire({ method: "POST", path: "/v1/video_generation", status: 200, note: `task_id ${task.taskId.slice(0, 10)}… · ${task.model}` });
      toast("ok", `Task queued on ${task.model} — est. ${cost} credits`);
      return task;
    },
    [creditsUsed, pushWire, toast]
  );

  const retry = useCallback(
    (id: string) => {
      setTasks((ts) =>
        ts.map((t) =>
          t.id === id
            ? { ...t, status: "Queueing", progress: 0, elapsed: 0, polls: 0, error: undefined, taskId: genTaskId(), finishedAt: undefined, createdAt: Date.now() }
            : t
        )
      );
      pushWire({ method: "POST", path: "/v1/video_generation", status: 200, note: "retry · new task_id issued" });
      toast("ok", "Task re-queued with a fresh task_id");
    },
    [pushWire, toast]
  );

  const removeTask = useCallback((id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const clearFinished = useCallback(() => {
    setTasks((ts) => ts.filter((t) => t.status === "Queueing" || t.status === "Preparing" || t.status === "Generating"));
  }, []);

  const addKey = useCallback(
    (name: string, key: string): boolean => {
      if (key.trim().length < 12) {
        toast("warn", "That key looks too short — MiniMax keys are long bearer tokens.");
        return false;
      }
      const k: ApiKey = { id: uid(), name: name.trim() || "Untitled key", key: key.trim(), createdAt: Date.now() };
      setKeys((ks) => [...ks, k]);
      setActiveKeyIdState(k.id);
      toast("ok", `Key “${k.name}” added and set active`);
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
      toast("warn", "Key revoked from this console");
    },
    [toast]
  );

  const setActiveKey = useCallback((id: string) => setActiveKeyIdState(id), []);
  const setRegion = useCallback(
    (r: Region) => {
      setRegionState(r);
      toast("ok", r === "intl" ? "Endpoint → api.minimax.io (international)" : "Endpoint → api.minimaxi.com (mainland China)");
    },
    [toast]
  );

  const running = tasks.filter((t) => t.status === "Queueing" || t.status === "Preparing" || t.status === "Generating").length;

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
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}

export { CREDITS_BUDGET };
