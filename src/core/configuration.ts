import type { Logger, LoggingLevel } from './logger.js';

export interface Configuration {
  serverBaseUrl?: string;
  iamBaseUrl?: string;
  tokenUrl?: string;
  tenantName?: string;
  username?: string;
  password?: string;
  grantType?: string;
  scope?: string;
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  timeout: number;
  /** `true` to verify against the system CAs, `false` to disable, or a path to a CA bundle. */
  verify: boolean | string;
  /** Path to a PEM client certificate, which may also contain the private key. */
  cert?: string;
  /** Path to the client private key, when it is not bundled with `cert`. */
  key?: string;
  /** Proxy URL, e.g. `http://proxy.example.com:8080`. */
  proxy?: string;
  loggingLevel: LoggingLevel;
  /** Overrides the built-in stderr logger. */
  logger?: Logger;
  maxRetries: number;
  /** Maximum number of requests held by the rate limiter bucket. */
  rateLimitCapacity: number;
  /** Rate limiter window, in seconds. */
  rateLimitPeriod: number;
  /** Tokens per second. Derived from capacity and period when omitted. */
  rateLimitRefillRate?: number;
}

export const CONFIGURATION_DEFAULTS = {
  timeout: 60,
  verify: true as boolean | string,
  loggingLevel: 'ERROR' as LoggingLevel,
  maxRetries: 3,
  rateLimitCapacity: 20000,
  rateLimitPeriod: 300,
} satisfies Partial<Configuration>;

export function createConfiguration(partial: Partial<Configuration> = {}): Configuration {
  return { ...CONFIGURATION_DEFAULTS, ...partial };
}
