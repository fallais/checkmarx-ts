/**
 * Helpers for building a configuration from environment variables. Nothing here
 * runs unless you call it — the SDK never reads the environment on its own.
 */

export function envString(env: NodeJS.ProcessEnv, name: string): string | undefined {
  return env[name] ?? env[name.toUpperCase()];
}

export function envNumber(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const raw = envString(env, name);
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** `"false"`/`"true"` become booleans; anything else is kept as a CA bundle path. */
export function envVerify(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: boolean | string,
): boolean | string {
  const raw = envString(env, name);
  if (raw === undefined) return fallback;
  const lowered = raw.toLowerCase();
  if (lowered === 'false') return false;
  if (lowered === 'true') return true;
  return raw;
}

export function requireEnv(env: NodeJS.ProcessEnv, name: string): string {
  const value = envString(env, name);
  if (!value) {
    throw new TypeError(`Missing required environment variable ${name}`);
  }
  return value;
}
