const KEY = "anon_id";

/** The id that ties anonymous results to this browser. Created on first use. */
export function getAnonId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

/** Existing anon id without creating one. */
export function peekAnonId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Start a fresh anonymous identity, e.g. after sign-out on a shared phone. */
export function resetAnonId(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // storage unavailable; nothing to reset
  }
}
