import type { Configuration } from '../core/configuration.js';
import { createConfiguration } from '../core/configuration.js';
import { asBoolean, asNumber, asString, getConfig } from '../core/configUtility.js';
import { parseLoggingLevel } from '../core/logger.js';
import { VERSION } from '../core/version.js';

const CONFIG_DEFAULT = {
  base_url: undefined,
  username: undefined,
  password: undefined,
  grant_type: 'password',
  scope: 'sast_rest_api access_control_api',
  client_id: 'resource_owner_client',
  client_secret: '014DF517-39D1-4453-B7B3-9930C563627C',
  scan_preset: 'Checkmarx Default',
  configuration: 'Default Configuration',
  team_full_name: '/CxServer',
  max_try: 2,
  report_folder: undefined,
  timeout: 59,
  verify: true,
  cert: undefined,
  proxy: undefined,
  logging_level: 'ERROR',
};

/**
 * Resolves `[CxSAST]` from the config file, `cxsast_*` env vars, and CLI flags.
 * The legacy `[checkmarx]` section is used when `[CxSAST]` has no `base_url`.
 */
export function constructConfiguration(overrides: Partial<Configuration> = {}): Configuration {
  const oldConfig = getConfig(CONFIG_DEFAULT, 'checkmarx', 'cxsast_');
  const newConfig = getConfig(CONFIG_DEFAULT, 'CxSAST', 'cxsast_');
  const config = newConfig['base_url'] ? newConfig : oldConfig;

  const baseUrl = (asString(config['base_url']) ?? '').replace(/\/+$/, '');

  return createConfiguration({
    serverBaseUrl: baseUrl,
    tokenUrl: `${baseUrl}/cxrestapi/auth/identity/connect/token`,
    username: asString(config['username']),
    password: asString(config['password']),
    grantType: asString(config['grant_type']),
    scope: asString(config['scope']),
    clientId: asString(config['client_id']),
    clientSecret: asString(config['client_secret']),
    timeout: asNumber(config['timeout'], 59),
    verify: asBoolean(config['verify'], true),
    cert: asString(config['cert']),
    proxy: asString(config['proxy']),
    loggingLevel: parseLoggingLevel(asString(config['logging_level'])),
    ...overrides,
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
