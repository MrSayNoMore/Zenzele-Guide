import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Device-local shortlist of saved jobs and bursaries — no account needed.
// State is persisted to localStorage so it survives page reloads and closing
// the tab. Jobs and bursaries are stored as id-keyed maps for O(1) lookups
// and toggles (the saved page reads `s.jobs` / `s.bursaries`).

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useSaved = create(
  persist(
    (set, get) => ({
      jobs: {},
      bursaries: {},

      toggleJob: (job) =>
        set((state) => {
          const jobs = { ...state.jobs };
          if (jobs[job.id]) {
            delete jobs[job.id];
          } else {
            jobs[job.id] = job;
          }
          return { jobs };
        }),

      toggleBursary: (bursary) =>
        set((state) => {
          const bursaries = { ...state.bursaries };
          if (bursaries[bursary.id]) {
            delete bursaries[bursary.id];
          } else {
            bursaries[bursary.id] = bursary;
          }
          return { bursaries };
        }),

      isJobSaved: (id) => Boolean(get().jobs[id]),
      isBursarySaved: (id) => Boolean(get().bursaries[id]),

      clear: () => set({ jobs: {}, bursaries: {} }),
    }),
    {
      name: "zenzele-saved",
      // SSR/prerender-safe: the server has no localStorage, so fall back to a
      // no-op store there; the real store rehydrates on the client.
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage,
      ),
    },
  ),
);
