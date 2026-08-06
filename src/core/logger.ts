export type LoggingLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'SILENT';

export interface Logger {
  debug(message: string): void;
  info(message: string): void;
  warning(message: string): void;
  error(message: string): void;
}

const LEVEL_VALUE: Record<LoggingLevel, number> = {
  DEBUG: 10,
  INFO: 20,
  WARNING: 30,
  ERROR: 40,
  CRITICAL: 50,
  SILENT: Number.POSITIVE_INFINITY,
};

export function parseLoggingLevel(level: string | undefined): LoggingLevel {
  const key = level?.toUpperCase() as LoggingLevel | undefined;
  return key && key in LEVEL_VALUE ? key : 'ERROR';
}

/** Writes to stderr so it never pollutes a caller's stdout. */
export function createConsoleLogger(level: LoggingLevel, name: string): Logger {
  const threshold = LEVEL_VALUE[level];
  const write = (lineLevel: LoggingLevel, message: string): void => {
    if (LEVEL_VALUE[lineLevel] < threshold) return;
    process.stderr.write(`${new Date().toISOString()} - ${name} - ${lineLevel} - ${message}\n`);
  };
  return {
    debug: (message) => write('DEBUG', message),
    info: (message) => write('INFO', message),
    warning: (message) => write('WARNING', message),
    error: (message) => write('ERROR', message),
  };
}

export const silentLogger: Logger = {
  debug: () => {},
  info: () => {},
  warning: () => {},
  error: () => {},
};
