import { i18n } from 'i18next';
import { Platform, ToastAndroid } from 'react-native';
import '../i18n';

type ToastType = 'error' | 'info' | 'success' | 'warning';

type ToastListener = (message: string, type?: ToastType) => void;

const listeners = new Set<ToastListener>();

export const addToastListener = (listener: ToastListener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const removeToastListener = (listener: ToastListener) => {
  listeners.delete(listener);
};

export const resolveErrorMessage = (error: unknown): string | null => {
  if (error == null) {
    return null;
  }

  if (typeof error === 'string') {
    const normalized = error.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (error instanceof Error) {
    // Prefer translating by error code if present
    const anyErr = error as any;
    const code: string | undefined = anyErr?.code;
    const params: Record<string, unknown> | undefined = anyErr?.params;
    if (typeof code === 'string' && code.trim().length > 0) {
      // Translate by error code from the bundled errors tree.
      try {
        const i18next = require('i18next') as { default: i18n } | i18n;
        const t = ('default' in i18next ? i18next.default : i18next).t.bind(
          'default' in i18next ? i18next.default : i18next,
        );
        const key = `errors.${code}`;
        const translated = t(key, params ?? {});
        if (translated && translated !== key) {
          return translated;
        }
      } catch {}
    }

    const normalized = (anyErr.message ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof error === 'object') {
    const record = error as Record<string, unknown> | null;
    if (record) {
      // Try translating by code if present
      const code = record.code;
      const params =
        (record.params as Record<string, unknown> | undefined) ?? undefined;
      if (typeof code === 'string' && code.trim().length > 0) {
        try {
          const i18next = require('i18next') as { default: i18n } | i18n;
          const t = ('default' in i18next ? i18next.default : i18next).t.bind(
            'default' in i18next ? i18next.default : i18next,
          );
          const key = `errors.${code}`;
          const translated = t(key, params ?? {});
          if (translated && translated !== key) {
            return translated;
          }
        } catch {}
      }

      const directMessage = record.message;
      if (
        typeof directMessage === 'string' &&
        directMessage.trim().length > 0
      ) {
        return directMessage.trim();
      }

      if (typeof record.error === 'object' && record.error !== null) {
        const nestedMessage = (record.error as Record<string, unknown>).message;
        if (
          typeof nestedMessage === 'string' &&
          nestedMessage.trim().length > 0
        ) {
          return nestedMessage.trim();
        }
      }

      if (typeof record.error === 'string' && record.error.trim().length > 0) {
        return record.error.trim();
      }
    }
  }

  return null;
};

export const showToast = (message: string, type: ToastType = 'info') => {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
    return;
  }

  if (listeners.size > 0) {
    listeners.forEach((listener) => listener(message, type));
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message);
    } else {
      console.warn(message);
    }
    return;
  }
};

const showErrorToast = (error: unknown) => {
  const message = resolveErrorMessage(error);
  if (!message) {
    return;
  }
  showToast(message, 'error');
};

export default showErrorToast;
