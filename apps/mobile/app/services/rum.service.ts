import { resolveApiUrl } from '../config/api';

const RUM_BASE_URL = resolveApiUrl('/rum');

type RumEvent = {
  type: 'view' | 'error' | 'action';
  name?: string;
  path?: string;
  message?: string;
  stack?: string;
  context?: Record<string, unknown>;
  userAgent?: string;
  timestamp?: number;
};

let rumEnabled = true;

export const initRum = (enabled: boolean = true): void => {
  rumEnabled = enabled;
};

export const trackView = async (
  name: string,
  path?: string,
  context?: Record<string, unknown>,
): Promise<void> => {
  if (!rumEnabled) return;
  await sendRumEvent({ type: 'view', name, path, context });
};

export const trackError = async (
  message: string,
  stack?: string,
  context?: Record<string, unknown>,
): Promise<void> => {
  if (!rumEnabled) return;
  await sendRumEvent({ type: 'error', message, stack, context });
};

export const trackAction = async (
  name: string,
  context?: Record<string, unknown>,
): Promise<void> => {
  if (!rumEnabled) return;
  await sendRumEvent({ type: 'action', name, context });
};

async function sendRumEvent(event: RumEvent): Promise<void> {
  try {
    const payload: RumEvent = {
      ...event,
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: Date.now(),
    };
    await fetch(`${RUM_BASE_URL}/event`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
  } catch {
    // best-effort only
  }
}
