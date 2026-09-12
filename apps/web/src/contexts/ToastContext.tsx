'use client';

import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

type ToastKind = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

const ToastContext = createContext<
  ((message: string, kind?: ToastKind) => void) | null
>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const sequence = useRef(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++sequence.current;
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(
      () => setToasts((current) => current.filter((toast) => toast.id !== id)),
      4500,
    );
  }, []);
  const value = useMemo(() => show, [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <button
            className={`toast toast-${toast.kind}`}
            key={toast.id}
            onClick={() =>
              setToasts((current) =>
                current.filter((entry) => entry.id !== toast.id),
              )
            }
            type="button"
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider');
  return value;
};
