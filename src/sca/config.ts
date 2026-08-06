import type { Configuration } from '../core/configuration.js';
import { createConfiguration } from '../core/configuration.js';
import { asBoolean, asNumber, asString, getConfig } from '../core/configUtility.js';
import { parseLoggingLevel } from '../core/logger.js';

const CONFIG_DEFAULT = {
  access_control_url: 'https://platform.checkmarx.net',
  server: 'https://api-sca.checkmarx.net',
  account: undefined,
  username: undefined,
  password: undefined,
  scope: 'sca_api access_control_api',
  timeout: 60,
  verify: true,
  cert: undefined,
  proxy: undefined,
  logging_level: 'ERROR',
};

/** Resolves `[CxSCA]` from the config file, `cxsca_*` env vars, and CLI flags. */
export function constructConfiguration(overrides: Partial<Configuration> = {}): Configuration {
  const config = getConfig(CONFIG_DEFAULT, 'CxSCA', 'cxsca_');
  const accessControlUrl = asString(config['access_control_url']) ?? '';

  return createConfiguration({
    serverBaseUrl: asString(config['server']),
    iamBaseUrl: accessControlUrl,
    tokenUrl: `${accessControlUrl}/identity/connect/token`,
    tenantName: asString(config['account']),
    username: asString(config['username']),
    password: asString(config['password']),
    scope: asString(config['scope']),
    timeout: asNumber(config['timeout'], 60),
    verify: asBoolean(config['verify'], true),
    cert: asString(config['cert']),
    proxy: asString(config['proxy']),
    loggingLevel: parseLoggingLevel(asString(config['logging_level'])),
    ...overrides,
  });
}
