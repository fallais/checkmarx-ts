import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, normalize } from 'node:path';

export type ConfigValue = string | boolean | number | undefined;
export type ConfigRecord = Record<string, ConfigValue>;

/** Options whose value is coerced to a boolean when it comes from env or CLI. */
const BOOLEAN_OPTIONS = new Set(['verify']);

/**
 * Resolution order, lowest priority first: defaults, `config.ini`, `config.json`,
 * environment variables, then command line arguments.
 *
 * The file lives at `~/.Checkmarx/config.{ini,json}` unless overridden by the
 * `checkmarx_config_path` environment variable or the `--checkmarx_config_path`
 * command line argument.
 */
export function getConfig(
  configDefault: ConfigRecord,
  section: string,
  prefix: string,
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): ConfigRecord {
  const optionList = Object.keys(configDefault);
  return {
    ...configDefault,
    ...cleanNullTerms(getConfigFromIniFile(section, optionList, argv, env)),
    ...cleanNullTerms(getConfigFromJsonFile(section, optionList, argv, env)),
    ...cleanNullTerms(getConfigFromEnvironmentVariables(prefix, optionList, env)),
    ...cleanNullTerms(getConfigFromCommandLineArguments(prefix, optionList, argv)),
  };
}

export function getConfigPath(
  fileExtension: '.ini' | '.json' = '.ini',
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
): string {
  let configFilePath = normalize(join(homedir(), `.Checkmarx/config${fileExtension}`));

  const fromEnv = env.checkmarx_config_path;
  if (fromEnv !== undefined) {
    configFilePath = fromEnv;
  }

  const fromCli = readCliOption(argv, 'checkmarx_config_path');
  if (fromCli) {
    configFilePath = fromCli;
  }

  return configFilePath;
}

function cleanNullTerms(record: ConfigRecord): ConfigRecord {
  const clean: ConfigRecord = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined && value !== null) {
      clean[key] = value;
    }
  }
  return clean;
}

function getConfigFromIniFile(
  section: string,
  optionList: string[],
  argv: string[],
  env: NodeJS.ProcessEnv,
): ConfigRecord {
  const configFilePath = getConfigPath('.ini', argv, env);
  if (!configFilePath.endsWith('.ini') || !existsSync(configFilePath)) {
    return {};
  }

  const parsed = parseIni(readFileSync(configFilePath, 'utf-8'));
  const sectionValues = parsed[section];
  if (!sectionValues) return {};

  const result: ConfigRecord = {};
  for (const option of optionList) {
    result[option] = sectionValues[option];
  }
  return result;
}

function getConfigFromJsonFile(
  section: string,
  optionList: string[],
  argv: string[],
  env: NodeJS.ProcessEnv,
): ConfigRecord {
  const configFilePath = getConfigPath('.json', argv, env);
  if (!configFilePath.endsWith('.json') || !existsSync(configFilePath)) {
    return {};
  }

  const parsed = JSON.parse(readFileSync(configFilePath, 'utf-8')) as Record<
    string,
    Record<string, ConfigValue> | undefined
  >;
  const sectionValues = parsed[section];
  if (!sectionValues) return {};

  const result: ConfigRecord = {};
  for (const option of optionList) {
    result[option] = sectionValues[option];
  }
  return result;
}

function getConfigFromEnvironmentVariables(
  prefix: string,
  optionList: string[],
  env: NodeJS.ProcessEnv,
): ConfigRecord {
  const result: ConfigRecord = {};
  for (const option of optionList) {
    const envVar = prefix + option;
    const raw = env[envVar] ?? env[envVar.toUpperCase()];
    result[option] = BOOLEAN_OPTIONS.has(option) ? coerceBoolean(raw) : raw;
  }
  return result;
}

function getConfigFromCommandLineArguments(
  prefix: string,
  optionList: string[],
  argv: string[],
): ConfigRecord {
  const result: ConfigRecord = {};
  for (const option of optionList) {
    const raw = readCliOption(argv, prefix + option);
    result[option] = BOOLEAN_OPTIONS.has(option) ? coerceBoolean(raw) : raw;
  }
  return result;
}

/** Reads `--name value` and `--name=value`, ignoring anything unrecognised. */
function readCliOption(argv: string[], name: string): string | undefined {
  const flag = `--${name}`;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === undefined) continue;
    if (arg === flag) {
      const next = argv[index + 1];
      return next !== undefined && !next.startsWith('--') ? next : undefined;
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.slice(flag.length + 1);
    }
  }
  return undefined;
}

function coerceBoolean(raw: string | undefined): ConfigValue {
  if (raw === undefined) return undefined;
  const lowered = raw.toLowerCase();
  if (lowered === 'false') return false;
  if (lowered === 'true') return true;
  return raw;
}

/** Minimal INI reader covering `[section]`, `key = value`, `#`/`;` comments. */
function parseIni(content: string): Record<string, Record<string, string> | undefined> {
  const result: Record<string, Record<string, string>> = {};
  let current: Record<string, string> | undefined;

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#') || line.startsWith(';')) continue;

    const sectionMatch = /^\[(.+)\]$/.exec(line);
    if (sectionMatch?.[1] !== undefined) {
      const name = sectionMatch[1].trim();
      current = result[name] ?? {};
      result[name] = current;
      continue;
    }

    if (current === undefined) continue;

    const separator = line.search(/[=:]/);
    if (separator === -1) continue;
    current[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  return result;
}

export function asString(value: ConfigValue): string | undefined {
  return value === undefined ? undefined : String(value);
}

export function asNumber(value: ConfigValue, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asBoolean(value: ConfigValue, fallback: boolean | string): boolean | string {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  const lowered = String(value).toLowerCase();
  if (lowered === 'false') return false;
  if (lowered === 'true') return true;
  return String(value);
}
