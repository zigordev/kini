type ApiErrorPayload = {
  status?: number;
  code?: string;
  params?: Record<string, unknown>;
  message?: string;
  error?: unknown;
};

export type NormalizedApiError = {
  status?: number;
  code?: string;
  params?: Record<string, unknown>;
  message?: string | null;
};

const extractMessageFromPayload = (payload: unknown): string | null => {
  if (!payload) {
    return null;
  }

  if (typeof payload === 'string') {
    const normalized = payload.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof payload === 'object') {
    const record = payload as Record<string, unknown>;

    const directMessage = record.message;
    if (typeof directMessage === 'string' && directMessage.trim().length > 0) {
      return directMessage.trim();
    }

    const nestedError = record.error;
    if (typeof nestedError === 'string' && nestedError.trim().length > 0) {
      return nestedError.trim();
    }

    if (nestedError && typeof nestedError === 'object') {
      const nestedMessage = (nestedError as Record<string, unknown>).message;
      if (
        typeof nestedMessage === 'string' &&
        nestedMessage.trim().length > 0
      ) {
        return nestedMessage.trim();
      }
    }
  }

  return null;
};

export const throwForErrorResponse = async (response: Response) => {
  if (response.ok) {
    return;
  }

  let message: string | null = null;
  let code: string | undefined;
  let params: Record<string, unknown> | undefined;
  let status: number | undefined = response.status;
  try {
    const text = await response.text();
    if (text) {
      try {
        const payload = JSON.parse(text) as ApiErrorPayload;
        message = extractMessageFromPayload(payload);
        if (payload && typeof payload === 'object') {
          if (typeof payload.code === 'string') code = payload.code;
          if (payload.params && typeof payload.params === 'object')
            params = payload.params as Record<string, unknown>;
          if (typeof payload.status === 'number') status = payload.status;
        }
      } catch {
        const normalized = text.trim();
        message = normalized.length > 0 ? normalized : null;
      }
    }
  } catch {
    // Ignore JSON parsing errors; we still throw below.
  }

  const error = new Error(message ?? '');
  (error as any).code = code;
  (error as any).params = params;
  (error as any).status = status;
  try {
    const { trackError } = await import('../services/rum.service');
    trackError((error as any).message ?? 'API error', undefined, {
      status,
      code,
      params,
      url: response.url,
    });
  } catch {
    // ignore RUM import errors
  }
  throw error;
};
