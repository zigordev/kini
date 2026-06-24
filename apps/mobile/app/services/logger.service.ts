import { resolveApiUrl } from '../config/api';

const LOGS_URL = resolveApiUrl('/logs');

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const logToServer = async (
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
) => {
  try {
    await fetch(LOGS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ level, message, context, timestamp: Date.now() }),
    });
  } catch {
    // ignore
  }
};

export const wireConsoleForwarding = () => {
  const orig = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };
  console.log = (...args) => {
    orig.log(...args);
    logToServer('info', String(args[0]), { args: safeArgs(args) });
  };
  console.warn = (...args) => {
    orig.warn(...args);
    logToServer('warn', String(args[0]), { args: safeArgs(args) });
  };
  console.error = (...args) => {
    orig.error(...args);
    logToServer('error', String(args[0]), { args: safeArgs(args) });
  };
  console.debug = (...args) => {
    orig.debug?.(...args);
    logToServer('debug', String(args[0]), { args: safeArgs(args) });
  };
};

function safeArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    try {
      if (
        typeof a === 'string' ||
        typeof a === 'number' ||
        typeof a === 'boolean'
      )
        return a;
      return JSON.parse(JSON.stringify(a));
    } catch {
      return String(a);
    }
  });
}
