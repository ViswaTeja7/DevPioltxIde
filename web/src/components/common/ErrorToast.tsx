import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';

interface FsErrorDetail {
  action: string;
  path: string;
  message: string;
}

interface Toast extends FsErrorDetail {
  id: number;
}

let toastCounter = 0;

// Surfaces filesystem failures the renderer would otherwise swallow. Announced through
// aria-live so screen-reader users learn that a save did not reach disk.
export const ErrorToast = () => {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<FsErrorDetail>).detail;
      if (!detail) return;
      toastCounter += 1;
      const toast: Toast = { ...detail, id: toastCounter };
      setToasts(previous => [...previous, toast]);
      window.setTimeout(() => {
        setToasts(previous => previous.filter(current => current.id !== toast.id));
      }, 8000);
    };
    window.addEventListener('devpilotx:fs-error', handler);
    return () => window.removeEventListener('devpilotx:fs-error', handler);
  }, []);

  return (
    <div
      className="pointer-events-none fixed bottom-8 right-4 z-50 flex w-80 flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-2 rounded border border-[#F85149]/60 bg-[#2D1B1B] px-3 py-2 text-[11px] text-[#FFD7D5] shadow-lg"
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#F85149]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">
              {t('common.filesystemError')}: {toast.action}
            </div>
            <div className="truncate font-mono text-[#FFA198]" title={toast.path}>
              {toast.path}
            </div>
            <div className="mt-0.5 break-words text-[#F0B7B3]">{toast.message}</div>
          </div>
          <button
            onClick={() =>
              setToasts(previous => previous.filter(current => current.id !== toast.id))
            }
            className="shrink-0 rounded p-0.5 text-[#FFA198] hover:bg-[#3D2323] hover:text-white"
            aria-label={t('common.dismiss')}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
};
