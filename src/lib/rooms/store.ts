import { useEffect, useSyncExternalStore } from "react";
import {
  emptyJourney,
  journeySchema,
  joinJourney,
  type Journey,
  type JourneyRoom,
  type Receipt,
  type SharedMemory,
} from "./model";

const stores = new Map<string, ReturnType<typeof createJourneyStore>>();
export const storageKey = (scope: string) => `quiet-space:room-journey:v1:${scope}`;
export function createJourneyStore(
  scope: string,
  getStorage: () => Pick<Storage, "getItem" | "setItem"> = () => localStorage,
) {
  let state = emptyJourney;
  let initialized = false;
  let error: string | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((fn) => fn());
  const read = () => {
    try {
      const raw = getStorage().getItem(storageKey(scope));
      state = raw ? journeySchema.parse(JSON.parse(raw)) : emptyJourney;
      error = null;
    } catch {
      error = "本地记录无法读取，原始数据已保留。请先导出或备份浏览器数据，再重试。";
    }
  };
  function commit(update: (current: Journey) => Journey) {
    if (!initialized) {
      read();
      initialized = true;
    }
    if (error) throw new Error(error);
    // Merge against the latest storage to avoid overwriting another open tab's changes.
    read();
    if (error) throw new Error(error);
    const next = journeySchema.parse(update(state));
    try {
      getStorage().setItem(storageKey(scope), JSON.stringify(next));
    } catch {
      throw new Error("浏览器存储已满或不可用。请导出记忆，并使用较小的封面后重试。");
    }
    state = next;
    emit();
  }
  return {
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => state,
    getError: () => error,
    initialize() {
      if (!initialized) {
        read();
        initialized = true;
        emit();
      }
    },
    reload() {
      read();
      emit();
    },
    join(room: JourneyRoom) {
      commit((s) => joinJourney(s, room));
    },
    setKeyReceipt(roomId: string, receipt: Receipt) {
      commit((s) => ({
        ...s,
        keys: s.keys.map((k) => (k.roomId === roomId ? { ...k, receipt } : k)),
      }));
    },
    addMemory(memory: SharedMemory) {
      commit((s) => {
        if (!s.keys.some((k) => k.roomId === memory.roomId))
          throw new Error("先加入这个小世界，再留下共同记忆。");
        return { ...s, memories: [memory, ...s.memories] };
      });
    },
    setMemoryReceipt(id: string, receipt: Receipt) {
      commit((s) => ({
        ...s,
        memories: s.memories.map((m) => (m.id === id ? { ...m, receipt } : m)),
      }));
    },
  };
}
export function useJourney(scope: string) {
  let store = stores.get(scope);
  if (!store) {
    store = createJourneyStore(scope);
    stores.set(scope, store);
  }
  const stableStore = store;
  const state = useSyncExternalStore(
    stableStore.subscribe,
    stableStore.getSnapshot,
    () => emptyJourney,
  );
  const error = useSyncExternalStore(stableStore.subscribe, stableStore.getError, () => null);
  useEffect(() => {
    stableStore.initialize();
    const listener = (event: StorageEvent) => {
      if (event.key === storageKey(scope) || event.key === null) stableStore.reload();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [scope, stableStore]);
  return { state, error, ...stableStore };
}
