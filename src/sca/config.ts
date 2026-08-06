import type { ApiClient } from '../core/apiClient.js';
import type { Configuration } from '../core/configuration.js';
import { createConfiguration } from '../core/configuration.js';
import { envNumber, envString, envVerify, requireEnv } from '../core/env.js';
import type { Logger, LoggingLevel } from '../core/logger.js';
import { parseLoggingLevel } from '../core/logger.js';

export const DEFAULT_SCA_SERVER = 'https://api-sca.checkmarx.net';
export const DEFAULT_SCA_ACCESS_CONTROL_URL = 'https://platform.checkmarx.net';

export interface ScaConfigInput {
  /** Tenant account name. */
  account: string;
  username: string;
  password: string;
  /** Defaults to `https://api-sca.checkmarx.net`. */
  server?: string;
  /** Defaults to `https://platform.checkmarx.net`. */
  accessControlUrl?: string;
  /** Defaults to `sca_api access_control_api`. */
  scope?: string;
  /** Seconds. Defaults to 60. */
  timeout?: number;
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
 * across several API classes, or a `ScaConfigInput` to build a private one.
 */
export type ScaApiInit = ApiClient | ScaConfigInput;

export function scaConfiguration(input: ScaConfigInput): Configuration {
  if (!input.account) {
    throw new TypeError('account is required to build a CxSCA configuration');
  }
  const accessControlUrl = (input.accessControlUrl ?? DEFAULT_SCA_ACCESS_CONTROL_URL).replace(
    /\/+$/,
    '',
  );
  const server = (input.server ?? DEFAULT_SCA_SERVER).replace(/\/+$/, '');

  return createConfiguration({
    serverBaseUrl: server,
    iamBaseUrl: accessControlUrl,
    tokenUrl: `${accessControlUrl}/identity/connect/token`,
    tenantName: input.account,
    username: input.username,
    password: input.password,
    scope: input.scope ?? 'sca_api access_control_api',
    timeout: input.timeout ?? 60,
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

/** Opt-in helper reading `CXSCA_*` variables. */
export function scaConfigurationFromEnv(env: NodeJS.ProcessEnv = process.env): Configuration {
  return scaConfiguration({
    account: requireEnv(env, 'CXSCA_ACCOUNT'),
    username: requireEnv(env, 'CXSCA_USERNAME'),
    password: requireEnv(env, 'CXSCA_PASSWORD'),
    server: envString(env, 'CXSCA_SERVER'),
    accessControlUrl: envString(env, 'CXSCA_ACCESS_CONTROL_URL'),
    scope: envString(env, 'CXSCA_SCOPE'),
    timeout: envNumber(env, 'CXSCA_TIMEOUT', 60),
    verify: envVerify(env, 'CXSCA_VERIFY', true),
    cert: envString(env, 'CXSCA_CERT'),
    key: envString(env, 'CXSCA_KEY'),
    proxy: envString(env, 'CXSCA_PROXY'),
    loggingLevel: parseLoggingLevel(envString(env, 'CXSCA_LOGGING_LEVEL')),
  });
}
