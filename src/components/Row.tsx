import React from 'react';
import { cx } from './ui';

/** One item in a resource list: thumbnail, text, badges, and trailing actions. */
export function Row({
  thumb,
  title,
  subtitle,
  meta,
  actions,
  onOpen,
  highlight = false,
  index = 0,
  children,
}: {
  thumb?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  onOpen?: () => void;
  highlight?: boolean;
  /** Position in the list, used to stagger the entrance animation. */
  index?: number;
  children?: React.ReactNode;
}) {
  return (
    <li
      className={cx(
        'card animate-fade-up overflow-hidden transition-shadow hover:shadow-lift',
        highlight && 'ring-1 ring-primary/25',
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
    >
      <div className='flex items-center gap-4 p-3 pr-2 sm:p-4 sm:pr-3'>
        <button
          type='button'
          onClick={onOpen}
          disabled={!onOpen}
          className='flex min-w-0 flex-1 items-center gap-4 text-left disabled:cursor-default'
        >
          {thumb}
          <div className='min-w-0 flex-1'>
            <div className='flex min-w-0 items-center gap-2'>
              {highlight && <span className='h-2 w-2 shrink-0 rounded-full bg-primary' />}
              <p className='truncate font-bold text-ink'>{title}</p>
            </div>
            {subtitle && <p className='mt-0.5 truncate text-[13px] text-ink/50'>{subtitle}</p>}
            {meta && <div className='mt-2 flex flex-wrap items-center gap-1.5'>{meta}</div>}
          </div>
        </button>
        {actions && <div className='flex shrink-0 items-center gap-0.5'>{actions}</div>}
      </div>
      {children}
    </li>
  );
}

export function Thumb({ src, fallback }: { src?: string; fallback: string }) {
  return (
    <span className='relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-gradient-d text-lg font-extrabold text-white'>
      {src ? <img src={src} alt='' className='absolute inset-0 h-full w-full object-cover' /> : fallback.charAt(0)}
    </span>
  );
}

export function Initials({ name, src }: { name: string; src?: string }) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-gradient-d text-sm font-extrabold text-white'>
      {src ? <img src={src} alt='' className='absolute inset-0 h-full w-full object-cover' /> : letters}
    </span>
  );
}
