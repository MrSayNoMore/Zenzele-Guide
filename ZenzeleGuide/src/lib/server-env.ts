// Reads a server setting (Cloudflare variable or secret, or a local env var).
// On Cloudflare Workers the settings arrive as the Worker's `env` bindings,
// which Nitro exposes as `globalThis.__env__`; `process.env` only mirrors them
// in some configurations, so check both.
export function serverEnv(name: string): string | undefined {
  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (fromProcess) return fromProcess;
  const bindings = (globalThis as { __env__?: Record<string, unknown> }).__env__;
  const value = bindings?.[name];
  return typeof value === "string" && value ? value : undefined;
}
