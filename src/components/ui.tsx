import React, { useRef, useState } from 'react';
import { LuCloudUpload, LuImagePlus, LuLoaderCircle, LuSearch, LuX } from 'react-icons/lu';
import { errorMessage, resolveImage, uploadImage } from '../lib/api';

export const cx = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

/* ---------------------------------------------------------------- Buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';

export function buttonClass(variant: Variant = 'primary', size: 'sm' | 'md' = 'md') {
  return cx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
    size === 'sm' ? 'px-3 py-1.5 text-[13px]' : 'px-4 py-2.5 text-sm',
    {
      primary: 'bg-brand-gradient text-white shadow-glow hover:-translate-y-px hover:brightness-110',
      secondary: 'border border-ink/10 bg-white text-ink shadow-sm hover:border-ink/20 hover:bg-surface',
      ghost: 'text-ink/60 hover:bg-ink/[0.05] hover:text-ink',
      danger: 'text-rose-600 hover:bg-rose-50',
      'danger-solid': 'bg-rose-600 text-white hover:bg-rose-700',
    }[variant],
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md';
  loading?: boolean;
}) {
  return (
    <button
      type='button'
      {...props}
      disabled={props.disabled || loading}
      className={cx(buttonClass(variant, size), className)}
    >
      {loading && <LuLoaderCircle className='h-4 w-4 animate-spin' />}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  tone = 'default',
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'default' | 'danger' }) {
  return (
    <button
      type='button'
      aria-label={label}
      title={label}
      {...props}
      className={cx(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-40',
        tone === 'danger'
          ? 'text-ink/40 hover:bg-rose-50 hover:text-rose-600'
          : 'text-ink/45 hover:bg-ink/[0.05] hover:text-ink',
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Layout */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='text-3xl font-extrabold tracking-tight'>{title}</h1>
        {description && <p className='mt-1.5 text-[15px] text-ink/55'>{description}</p>}
      </div>
      {actions && <div className='flex shrink-0 flex-wrap gap-2'>{actions}</div>}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <div className='mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
      {children}
    </div>
  );
}

const BADGE_TONES = {
  green: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20',
  amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/20',
  slate: 'bg-slate-500/10 text-slate-600 ring-slate-500/20',
  blue: 'bg-sky-500/10 text-sky-700 ring-sky-500/20',
  pink: 'bg-primary/10 text-primary ring-primary/20',
  violet: 'bg-secondary/10 text-secondary ring-secondary/20',
};
const DOT_TONES = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
  blue: 'bg-sky-500',
  pink: 'bg-primary',
  violet: 'bg-secondary',
};

export function Badge({
  tone = 'slate',
  dot = false,
  children,
}: {
  tone?: keyof typeof BADGE_TONES;
  dot?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset',
        BADGE_TONES[tone],
      )}
    >
      {dot && <span className={cx('h-1.5 w-1.5 rounded-full', DOT_TONES[tone])} />}
      {typeof children === 'string' ? children.charAt(0).toUpperCase() + children.slice(1) : children}
    </span>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className='relative w-full md:w-72'>
      <LuSearch className='pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35' />
      <input
        type='search'
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='input !pl-10'
      />
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className='flex gap-1 overflow-x-auto rounded-xl bg-ink/[0.05] p-1 [scrollbar-width:none]'>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type='button'
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cx(
              'flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition-all',
              active ? 'bg-white text-ink shadow-sm' : 'text-ink/55 hover:text-ink',
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className={cx('text-xs', active ? 'text-ink/45' : 'text-ink/35')}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className='card flex flex-col items-center px-6 py-16 text-center'>
      <span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary'>
        <Icon className='h-6 w-6' />
      </span>
      <h3 className='mt-4 text-lg font-extrabold'>{title}</h3>
      {description && <p className='mt-1 max-w-sm text-sm text-ink/55'>{description}</p>}
      {action && <div className='mt-5'>{action}</div>}
    </div>
  );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className='space-y-3'>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className='card flex animate-pulse items-center gap-4 p-4'>
          <div className='h-12 w-16 rounded-xl bg-ink/[0.06]' />
          <div className='flex-1 space-y-2'>
            <div className='h-3.5 w-1/3 rounded bg-ink/[0.07]' />
            <div className='h-3 w-1/2 rounded bg-ink/[0.05]' />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p role='alert' className='mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700'>
      {error}
    </p>
  );
}

/* ------------------------------------------------------------------ Forms */

export function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cx('block', className)}>
      <span className='label'>{label}</span>
      {children}
      {hint && <span className='hint'>{hint}</span>}
    </label>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className='border-b border-ink/[0.06] px-6 py-6 last:border-0'>
      <h3 className='text-[15px] font-extrabold'>{title}</h3>
      {description && <p className='mt-0.5 text-[13px] text-ink/50'>{description}</p>}
      <div className='mt-5 space-y-4'>{children}</div>
    </section>
  );
}

/** Textarea where each line becomes one list item. */
export function LinesField({
  label,
  value,
  onChange,
  placeholder,
  hint = 'One item per line.',
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        value={value.join('\n')}
        onChange={(e) =>
          onChange(
            e.target.value
              .split('\n')
              .map((s) => s.trimEnd())
              .filter((s, i, arr) => s !== '' || i < arr.length - 1),
          )
        }
        placeholder={placeholder}
        className='input min-h-[110px] resize-y leading-relaxed'
      />
    </Field>
  );
}

/** Tag-style editor: type and press Enter or comma to add; click × to remove. */
export function ChipsField({
  label,
  value,
  onChange,
  placeholder = 'Type and press Enter',
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');

  const add = (raw: string) => {
    const items = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && !value.includes(s));
    if (items.length) onChange([...value, ...items]);
    setDraft('');
  };

  return (
    <div>
      <span className='label'>{label}</span>
      <div className='input flex min-h-[46px] flex-wrap items-center gap-1.5 !py-2 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10'>
        {value.map((item) => (
          <span
            key={item}
            className='inline-flex items-center gap-1 rounded-lg bg-primary/[0.08] py-1 pl-2.5 pr-1 text-xs font-bold text-primary'
          >
            {item}
            <button
              type='button'
              aria-label={`Remove ${item}`}
              onClick={() => onChange(value.filter((v) => v !== item))}
              className='rounded p-0.5 hover:bg-primary/15'
            >
              <LuX className='h-3 w-3' />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => {
            if (e.target.value.includes(',')) add(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add(draft);
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? '' : placeholder}
          className='min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink/35'
        />
      </div>
    </div>
  );
}

function useUploader(onUploaded: (url: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (files: FileList | File[] | null | undefined) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith('image/'));
    if (!list.length) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of list) onUploaded(await uploadImage(file));
    } catch (err) {
      setError(errorMessage(err, 'Upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return { busy, error, upload };
}

/** Single image: drag-and-drop or click to upload, with preview and URL fallback. */
export function ImageField({
  label,
  value,
  onChange,
  aspect = 'aspect-[16/9]',
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { busy, error, upload } = useUploader(onChange);
  const preview = resolveImage(value);

  return (
    <div>
      <span className='label'>{label}</span>
      <div
        role='button'
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          upload(e.dataTransfer.files);
        }}
        className={cx(
          'group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-colors',
          aspect,
          dragging ? 'border-primary bg-primary/[0.04]' : 'border-ink/10 bg-surface hover:border-primary/40',
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt='' className='absolute inset-0 h-full w-full object-cover' />
            <div className='absolute inset-0 flex items-center justify-center bg-ink-950/50 opacity-0 transition-opacity group-hover:opacity-100'>
              <span className='rounded-full bg-white px-3 py-1.5 text-xs font-bold text-ink'>
                Replace image
              </span>
            </div>
          </>
        ) : (
          <div className='flex flex-col items-center gap-2 p-6 text-center'>
            <LuCloudUpload className='h-7 w-7 text-ink/30' />
            <span className='text-sm font-bold text-ink/60'>Drop an image or click to upload</span>
            <span className='text-xs text-ink/40'>PNG, JPG, WebP or SVG — up to 8MB</span>
          </div>
        )}
        {busy && (
          <div className='absolute inset-0 flex items-center justify-center bg-white/70'>
            <LuLoaderCircle className='h-6 w-6 animate-spin text-primary' />
          </div>
        )}
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='sr-only'
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = '';
        }}
      />
      {error && <p className='mt-1.5 text-xs font-medium text-rose-600'>{error}</p>}
      <div className='mt-2 flex gap-2'>
        <input
          type='url'
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder='…or paste an image URL'
          className='input'
        />
        {value && (
          <Button variant='secondary' onClick={() => onChange('')}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

/** Ordered image gallery with multi-file upload and per-image removal. */
export function GalleryField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const latest = useRef(value);
  latest.current = value;
  const { busy, error, upload } = useUploader((url) => {
    latest.current = [...latest.current, url];
    onChange(latest.current);
  });

  return (
    <div>
      <span className='label'>{label}</span>
      <div className='grid grid-cols-3 gap-2 sm:grid-cols-4'>
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className='group relative aspect-[4/3] overflow-hidden rounded-xl bg-surface'>
            <img src={resolveImage(url)} alt='' className='h-full w-full object-cover' />
            {i === 0 && (
              <span className='absolute left-1.5 top-1.5 rounded-md bg-ink-950/70 px-1.5 py-0.5 text-[10px] font-bold text-white'>
                First
              </span>
            )}
            <button
              type='button'
              aria-label='Remove image'
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className='absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink opacity-0 shadow transition-opacity hover:text-rose-600 group-hover:opacity-100'
            >
              <LuX className='h-3.5 w-3.5' />
            </button>
          </div>
        ))}
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className='flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/10 text-ink/45 transition-colors hover:border-primary/40 hover:text-primary'
        >
          {busy ? (
            <LuLoaderCircle className='h-5 w-5 animate-spin' />
          ) : (
            <LuImagePlus className='h-5 w-5' />
          )}
          <span className='text-[11px] font-bold'>{busy ? 'Uploading…' : 'Add images'}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        className='sr-only'
        onChange={(e) => {
          upload(e.target.files);
          e.target.value = '';
        }}
      />
      {error && <p className='mt-1.5 text-xs font-medium text-rose-600'>{error}</p>}
      <span className='hint'>Shown as the project&apos;s image carousel. Hover an image to remove it.</span>
    </div>
  );
}
