import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LuCircleCheck, LuCircleX, LuTriangleAlert, LuX } from 'react-icons/lu';
import { Button } from './ui';

/* ------------------------------------------------------------------ Toasts */

type ToastTone = 'success' | 'error';
interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
}

const ToastContext = createContext<(message: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = ++nextId.current;
      setToasts((all) => [...all.slice(-3), { id, tone, message }]);
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      {createPortal(
        <div
          aria-live='polite'
          className='pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end'
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              className='pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl bg-ink-950 p-4 pr-3 text-sm text-white shadow-lift'
            >
              {toast.tone === 'success' ? (
                <LuCircleCheck className='mt-0.5 h-5 w-5 shrink-0 text-emerald-400' />
              ) : (
                <LuCircleX className='mt-0.5 h-5 w-5 shrink-0 text-rose-400' />
              )}
              <p className='flex-1 leading-relaxed'>{toast.message}</p>
              <button
                type='button'
                aria-label='Dismiss'
                onClick={() => dismiss(toast.id)}
                className='rounded-lg p-0.5 text-white/50 hover:text-white'
              >
                <LuX className='h-4 w-4' />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

/* ----------------------------------------------------------------- Confirm */

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(
  async () => false,
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<
    (ConfirmOptions & { resolve: (ok: boolean) => void }) | null
  >(null);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setRequest({ ...options, resolve })),
    [],
  );

  const settle = useCallback(
    (ok: boolean) => {
      request?.resolve(ok);
      setRequest(null);
    },
    [request],
  );

  useEffect(() => {
    if (!request) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') settle(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [request, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request &&
        createPortal(
          <div
            className='fixed inset-0 z-[90] flex animate-fade-in items-center justify-center bg-ink-950/50 p-4 backdrop-blur-sm'
            onClick={() => settle(false)}
          >
            <div
              role='alertdialog'
              aria-modal='true'
              aria-labelledby='confirm-title'
              className='w-full max-w-sm animate-pop-in rounded-3xl bg-white p-6 shadow-lift'
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  request.danger ? 'bg-rose-50 text-rose-600' : 'bg-primary/10 text-primary'
                }`}
              >
                <LuTriangleAlert className='h-5 w-5' />
              </span>
              <h2 id='confirm-title' className='mt-4 text-lg font-extrabold'>
                {request.title}
              </h2>
              {request.message && (
                <p className='mt-1.5 text-sm leading-relaxed text-ink/60'>{request.message}</p>
              )}
              <div className='mt-6 flex justify-end gap-2'>
                <Button variant='secondary' onClick={() => settle(false)}>
                  Cancel
                </Button>
                <Button
                  variant={request.danger ? 'danger-solid' : 'primary'}
                  onClick={() => settle(true)}
                  autoFocus
                >
                  {request.confirmLabel ?? 'Confirm'}
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ConfirmContext.Provider>
  );
}
