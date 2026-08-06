import type { ApiClient } from '../core/apiClient.js';
import type { Configuration } from '../core/configuration.js';
import { createConfiguration } from '../core/configuration.js';
import { envNumber, envString, envVerify, requireEnv } from '../core/env.js';
import type { Logger, LoggingLevel } from '../core/logger.js';
import { parseLoggingLevel } from '../core/logger.js';
import { VERSION } from '../core/version.js';

/** Ships with CxSAST and is the same on every installation. */
export const DEFAULT_CLIENT_SECRET = '014DF517-39D1-4453-B7B3-9930C563627C';

export interface SastConfigInput {
  /** Base URL of the CxSAST server, e.g. `https://sast.example.com`. */
  baseUrl: string;
  username?: string;
  password?: string;
  /** Defaults to `password`. */
  grantType?: string;
  /** Defaults to `sast_rest_api access_control_api`. */
  scope?: string;
  /** Defaults to `resource_owner_client`. */
  clientId?: string;
  /** Defaults to the stock CxSAST secret. */
  clientSecret?: string;
  /** Seconds. Defaults to 59. */
  timeout?: number;
  /** `true` verifies against the system CAs, `false` disables, a string is a CA path. */
  verify?: boolean | string;
  cert?: string;
  key?: string;
  proxy?: string;
  loggingLevel?: LoggingLevel;
  logger?: Logger;
  maxRetries?: number;
  rateLimitCapacity?: number;
  rateLimitPeriod?: number;
  rateLimitRefillRate?: number;
}

/**
 * Pass an `ApiClient` to share one token, connection pool and rate limiter
 * across several API classes, or a `SastConfigInput` to build a private one.
 */
export type SastApiInit = ApiClient | SastConfigInput;

export function sastConfiguration(input: SastConfigInput): Configuration {
  if (!input.baseUrl) {
    throw new TypeError('baseUrl is required to build a CxSAST configuration');
  }
  const baseUrl = input.baseUrl.replace(/\/+$/, '');

  return createConfiguration({
    serverBaseUrl: baseUrl,
    tokenUrl: `${baseUrl}/cxrestapi/auth/identity/connect/token`,
    username: input.username,
    password: input.password,
    grantType: input.grantType ?? 'password',
    scope: input.scope ?? 'sast_rest_api access_control_api',
    clientId: input.clientId ?? 'resource_owner_client',
    clientSecret: input.clientSecret ?? DEFAULT_CLIENT_SECRET,
    timeout: input.timeout ?? 59,
    verify: input.verify ?? true,
    cert: input.cert,
    key: input.key,
    proxy: input.proxy,
    loggingLevel: input.loggingLevel ?? 'ERROR',
    logger: input.logger,
    maxRetries: input.maxRetries ?? 3,
    rateLimitCapacity: input.rateLimitCapacity ?? 20000,
    rateLimitPeriod: input.rateLimitPeriod ?? 300,
    rateLimitRefillRate: input.rateLimitRefillRate,
  });
}

/**
 * Opt-in helper reading `CXSAST_*` variables. Throws when `CXSAST_BASE_URL` is
 * unset rather than falling back to a guess.
 */
export function sastConfigurationFromEnv(env: NodeJS.ProcessEnv = process.env): Configuration {
  return sastConfiguration({
    baseUrl: requireEnv(env, 'CXSAST_BASE_URL'),
    username: envString(env, 'CXSAST_USERNAME'),
    password: envString(env, 'CXSAST_PASSWORD'),
    grantType: envString(env, 'CXSAST_GRANT_TYPE'),
    scope: envString(env, 'CXSAST_SCOPE'),
    clientId: envString(env, 'CXSAST_CLIENT_ID'),
    clientSecret: envString(env, 'CXSAST_CLIENT_SECRET'),
    timeout: envNumber(env, 'CXSAST_TIMEOUT', 59),
    verify: envVerify(env, 'CXSAST_VERIFY', true),
    cert: envString(env, 'CXSAST_CERT'),
    key: envString(env, 'CXSAST_KEY'),
    proxy: envString(env, 'CXSAST_PROXY'),
    loggingLevel: parseLoggingLevel(envString(env, 'CXSAST_LOGGING_LEVEL')),
  });
}

export function getHeaders(
  apiVersion = '1.0',
  extraHeader?: Record<string, string>,
): Record<string, string> {
  return {
    cxOrigin: `checkmarx-ts ${VERSION}`,
    'Content-Type': `application/json;v=${apiVersion}`,
    ...extraHeader,
  };
}
