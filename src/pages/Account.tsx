import { useState } from 'react';
import { LuShieldCheck } from 'react-icons/lu';
import { useToast } from '../components/feedback';
import { Button, ErrorNote, Field, PageHeader } from '../components/ui';
import { api, errorMessage } from '../lib/api';
import { useSession } from '../lib/session';

const MIN_LENGTH = 10;
const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function AccountPage() {
  const { me } = useSession();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mismatch = form.confirmPassword !== '' && form.newPassword !== form.confirmPassword;
  const tooShort = form.newPassword !== '' && form.newPassword.length < MIN_LENGTH;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mismatch || tooShort) return;
    setSaving(true);
    setError(null);
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      setForm(EMPTY);
      toast('Password updated — use it next time you sign in.');
    } catch (err) {
      setError(errorMessage(err, 'Could not change password'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title='Account' description='Your admin profile and sign-in security.' />

      <div className='grid gap-6 lg:grid-cols-[1fr_1.4fr]'>
        <div className='card h-fit p-6'>
          <span className='flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient-d text-2xl font-extrabold text-white shadow-glow'>
            {(me?.name ?? 'A').charAt(0)}
          </span>
          <p className='mt-4 text-lg font-extrabold'>{me?.name ?? 'Admin'}</p>
          <p className='text-sm text-ink/55'>{me?.email}</p>
          <p className='mt-6 rounded-xl bg-surface p-4 text-[13px] leading-relaxed text-ink/60'>
            Changing your password here takes effect immediately. The <code className='font-bold'>ADMIN_PASSWORD</code>{' '}
            server variable is only used to create the very first account, so editing it later has no effect.
          </p>
        </div>

        <form onSubmit={submit} className='card p-6'>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary'>
              <LuShieldCheck className='h-5 w-5' />
            </span>
            <div>
              <h2 className='font-extrabold'>Change password</h2>
              <p className='text-[13px] text-ink/50'>At least {MIN_LENGTH} characters.</p>
            </div>
          </div>

          <div className='mt-6 space-y-4'>
            <ErrorNote error={error} />
            <Field label='Current password'>
              <input
                type='password'
                autoComplete='current-password'
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className='input'
                required
              />
            </Field>
            <Field label='New password' hint={tooShort ? `Needs ${MIN_LENGTH - form.newPassword.length} more characters.` : undefined}>
              <input
                type='password'
                autoComplete='new-password'
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className='input'
                minLength={MIN_LENGTH}
                required
              />
            </Field>
            <Field label='Confirm new password' hint={mismatch ? 'Passwords do not match.' : undefined}>
              <input
                type='password'
                autoComplete='new-password'
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className='input'
                required
              />
            </Field>
            <div className='flex justify-end pt-2'>
              <Button type='submit' loading={saving} disabled={mismatch || tooShort}>
                Update password
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
