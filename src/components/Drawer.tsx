import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { useConfirm } from './feedback';
import { Button } from './ui';

interface DrawerProps {
  title: string;
  subtitle?: string;
  /** When true, closing asks before discarding changes. */
  dirty?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel?: string;
  error?: string | null;
  children: React.ReactNode;
}

/** Right-hand slide-over panel holding an edit form with a sticky save bar. */
export default function Drawer({
  title,
  subtitle,
  dirty = false,
  saving = false,
  onClose,
  onSubmit,
  submitLabel = 'Save changes',
  error,
  children,
}: DrawerProps) {
  const confirm = useConfirm();

  const requestClose = useCallback(async () => {
    if (
      dirty &&
      !(await confirm({
        title: 'Discard unsaved changes?',
        message: 'Your edits to this item will be lost.',
        confirmLabel: 'Discard',
        danger: true,
      }))
    )
      return;
    onClose();
  }, [dirty, confirm, onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      // Let an open confirm dialog handle its own Escape.
      if (e.key === 'Escape' && !document.querySelector('[role=alertdialog]')) requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [requestClose]);

  return createPortal(
    <div className='fixed inset-0 z-50 flex justify-end' role='dialog' aria-modal='true' aria-labelledby='drawer-title'>
      <div className='absolute inset-0 animate-fade-in bg-ink-950/40 backdrop-blur-[2px]' onClick={requestClose} />
      <form
        onSubmit={onSubmit}
        className='relative flex h-full w-full max-w-2xl animate-slide-in-right flex-col bg-white shadow-2xl'
      >
        <header className='flex items-start justify-between gap-4 border-b border-ink/[0.06] px-6 py-5'>
          <div className='min-w-0'>
            <h2 id='drawer-title' className='truncate text-xl font-extrabold'>
              {title}
            </h2>
            {subtitle && <p className='mt-0.5 text-sm text-ink/50'>{subtitle}</p>}
          </div>
          <button
            type='button'
            aria-label='Close'
            onClick={requestClose}
            className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink/45 hover:bg-ink/5 hover:text-ink'
          >
            <LuX className='h-5 w-5' />
          </button>
        </header>

        <div className='flex-1 overflow-y-auto overscroll-contain'>
          {error && (
            <p role='alert' className='mx-6 mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
              {error}
            </p>
          )}
          {children}
        </div>

        <footer className='flex items-center justify-between gap-3 border-t border-ink/[0.06] bg-white px-6 py-4'>
          <span className='text-xs font-semibold text-ink/40'>
            {dirty ? 'Unsaved changes' : 'No changes yet'}
          </span>
          <div className='flex gap-2'>
            <Button variant='secondary' onClick={requestClose}>
              Cancel
            </Button>
            <Button type='submit' loading={saving}>
              {submitLabel}
            </Button>
          </div>
        </footer>
      </form>
    </div>,
    document.body,
  );
}

/** Tracks an editable copy of a record and whether it differs from the original. */
export function isDirty<T>(original: T | null, current: T | null) {
  return JSON.stringify(original) !== JSON.stringify(current);
}
