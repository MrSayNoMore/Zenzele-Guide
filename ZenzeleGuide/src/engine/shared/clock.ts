import type { Clock } from "../types";

export function createClock(now?: Date | string): Clock {
  const fixedDate = now ? new Date(now) : undefined;

  return {
    today: () => fixedDate ?? new Date(),
    now: () => fixedDate ?? new Date(),
  };
}

export function defaultClock(): Clock {
  return createClock();
}
