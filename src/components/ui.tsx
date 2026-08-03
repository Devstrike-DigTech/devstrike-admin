import React, { useState } from 'react';
import { uploadImage, API_URL } from '../lib/api';

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h1 className="text-2xl font-bold">{title}</h1>
      {action}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
}) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/85',
    ghost: 'border border-gray-200 text-gray-700 hover:bg-gray-100',
    danger: 'text-red-600 hover:bg-red-50',
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${styles} ${props.className ?? ''}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none';

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-5 text-xl font-bold">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
      {error}
    </p>
  );
}

/** Image picker that uploads to the API and stores the returned URL. */
export function ImageField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = value?.startsWith('/uploads') ? `${API_URL}${value}` : value;

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        {preview && (
          // eslint-disable-next-line jsx-a11y/alt-text
          <img src={preview} className="h-14 w-20 rounded-md object-cover" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setBusy(true);
            setError(null);
            try {
              onChange(await uploadImage(file));
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Upload failed');
            } finally {
              setBusy(false);
            }
          }}
          className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary"
        />
        {busy && <span className="text-xs text-gray-500">Uploading…</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="…or paste an image URL"
        className={`${inputClass} mt-2`}
      />
    </div>
  );
}

/** Textarea where each line becomes one array item. */
export function LinesField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  return (
    <Field label={`${label} (one per line)`}>
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
        className={`${inputClass} min-h-[90px]`}
      />
    </Field>
  );
}
