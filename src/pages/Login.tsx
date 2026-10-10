import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { LuArrowRight, LuEye, LuEyeOff } from 'react-icons/lu';
import { api, errorMessage, getToken, setToken } from '../lib/api';
import { Button, ErrorNote, Field } from '../components/ui';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to='/' replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api<{ token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(res.token);
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='grid min-h-screen lg:grid-cols-[1.1fr_1fr]'>
      <div className='relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between'>
        <div aria-hidden className='absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/40 blur-[120px]' />
        <div aria-hidden className='absolute -bottom-40 right-0 h-[30rem] w-[30rem] rounded-full bg-secondary/50 blur-[120px]' />
        <div
          aria-hidden
          className='absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]'
        />
        <div className='relative flex items-center gap-3'>
          <img src='/logo.svg' alt='' className='h-11 w-11' />
          <span className='text-xl font-extrabold tracking-tight'>devstrike</span>
        </div>
        <div className='relative max-w-md'>
          <h1 className='text-5xl font-extrabold leading-[1.05]'>
            Manage everything the world sees of{' '}
            <span className='bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent'>
              Devstrike.
            </span>
          </h1>
          <p className='mt-5 text-lg text-white/60'>
            Projects, open roles, team profiles, articles — plus every application and message that comes in.
          </p>
        </div>
        <p className='relative text-sm text-white/35'>© {new Date().getFullYear()} Devstrike Digital Limited</p>
      </div>

      <div className='flex items-center justify-center bg-white p-6 sm:p-12'>
        <div className='w-full max-w-sm animate-fade-up'>
          <div className='mb-10 flex items-center gap-2.5 lg:hidden'>
            <img src='/logo.svg' alt='' className='h-10 w-10' />
            <span className='text-lg font-extrabold tracking-tight'>devstrike admin</span>
          </div>
          <h2 className='text-3xl font-extrabold tracking-tight'>Welcome back</h2>
          <p className='mb-8 mt-1.5 text-ink/55'>Sign in to manage site content.</p>

          {params.get('expired') && !error && (
            <p className='mb-5 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800'>
              Your session expired — please sign in again.
            </p>
          )}
          <ErrorNote error={error} />

          <form onSubmit={submit} className='space-y-4'>
            <Field label='Email'>
              <input
                type='email'
                autoComplete='username'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='input !py-3'
                required
                autoFocus
              />
            </Field>
            <Field label='Password'>
              <div className='relative'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete='current-password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='input !py-3 !pr-11'
                  required
                />
                <button
                  type='button'
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink/40 hover:text-ink'
                >
                  {showPassword ? <LuEyeOff className='h-4 w-4' /> : <LuEye className='h-4 w-4' />}
                </button>
              </div>
            </Field>
            <Button type='submit' loading={loading} className='mt-2 w-full !py-3'>
              Sign in {!loading && <LuArrowRight className='h-4 w-4' />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
