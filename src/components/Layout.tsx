import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  LuBriefcase,
  LuExternalLink,
  LuFolderKanban,
  LuInbox,
  LuKeyRound,
  LuLayoutDashboard,
  LuLogOut,
  LuMail,
  LuMenu,
  LuNewspaper,
  LuUsers,
  LuX,
} from 'react-icons/lu';
import { clearToken, SITE_URL } from '../lib/api';
import { SessionProvider, useSession } from '../lib/session';
import type { AdminStats } from '../lib/types';
import { cx } from './ui';

interface NavItem {
  to: string;
  label: string;
  icon: IconType;
  badge?: (stats: AdminStats) => number;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LuLayoutDashboard }],
  },
  {
    title: 'Content',
    items: [
      { to: '/projects', label: 'Projects', icon: LuFolderKanban },
      { to: '/vacancies', label: 'Vacancies', icon: LuBriefcase },
      { to: '/team', label: 'Team', icon: LuUsers },
      { to: '/posts', label: 'Posts', icon: LuNewspaper },
    ],
  },
  {
    title: 'Inbox',
    items: [
      { to: '/applications', label: 'Applications', icon: LuInbox, badge: (s) => s.applications.new },
      { to: '/messages', label: 'Messages', icon: LuMail, badge: (s) => s.messages.unread },
    ],
  },
];

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { me, stats } = useSession();

  return (
    <div className='relative flex h-full flex-col overflow-hidden bg-ink-950 text-white'>
      <div
        aria-hidden
        className='pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/30 blur-[90px]'
      />
      <div
        aria-hidden
        className='pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-secondary/40 blur-[90px]'
      />

      <div className='relative flex items-center gap-2.5 px-5 pb-6 pt-6'>
        <img src='/logo.svg' alt='' className='h-9 w-9' />
        <div>
          <p className='text-[17px] font-extrabold leading-none tracking-tight'>devstrike</p>
          <p className='mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/40'>Admin</p>
        </div>
      </div>

      <nav className='relative flex-1 space-y-6 overflow-y-auto px-3'>
        {NAV_GROUPS.map((group) => (
          <div key={group.title}>
            <p className='mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/30'>
              {group.title}
            </p>
            <div className='space-y-0.5'>
              {group.items.map((item) => {
                const count = stats && item.badge ? item.badge(stats) : 0;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                        isActive
                          ? 'bg-white/[0.09] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
                          : 'text-white/55 hover:bg-white/[0.05] hover:text-white',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cx('h-[18px] w-[18px]', isActive ? 'text-pink-300' : 'text-white/40 group-hover:text-white/70')}
                        />
                        <span className='flex-1'>{item.label}</span>
                        {count > 0 && (
                          <span className='rounded-full bg-brand-gradient px-2 py-0.5 text-[11px] font-extrabold text-white shadow-glow'>
                            {count}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}

        <a
          href={SITE_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/55 transition-colors hover:bg-white/[0.05] hover:text-white'
        >
          <LuExternalLink className='h-[18px] w-[18px] text-white/40' />
          View website
        </a>
      </nav>

      <div className='relative border-t border-white/10 p-3'>
        <div className='flex items-center gap-3 px-2 py-2'>
          <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient-d text-sm font-extrabold'>
            {(me?.name ?? 'A').charAt(0)}
          </span>
          <div className='min-w-0 flex-1'>
            <p className='truncate text-sm font-bold'>{me?.name ?? 'Admin'}</p>
            <p className='truncate text-xs text-white/45'>{me?.email ?? '…'}</p>
          </div>
        </div>
        <div className='mt-1 grid grid-cols-2 gap-1'>
          <NavLink
            to='/account'
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors',
                isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/[0.06] hover:text-white',
              )
            }
          >
            <LuKeyRound className='h-3.5 w-3.5' /> Account
          </NavLink>
          <button
            type='button'
            onClick={() => {
              clearToken();
              navigate('/login');
            }}
            className='flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white'
          >
            <LuLogOut className='h-3.5 w-3.5' /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function Shell() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className='min-h-screen lg:pl-64'>
      <aside className='fixed inset-y-0 left-0 z-30 hidden w-64 lg:block'>
        <Sidebar />
      </aside>

      <header className='sticky top-0 z-20 flex items-center justify-between border-b border-ink/[0.06] bg-white/80 px-4 py-3 backdrop-blur-lg lg:hidden'>
        <div className='flex items-center gap-2'>
          <img src='/logo.svg' alt='' className='h-8 w-8' />
          <span className='font-extrabold tracking-tight'>devstrike admin</span>
        </div>
        <button
          type='button'
          aria-label='Open menu'
          onClick={() => setOpen(true)}
          className='flex h-10 w-10 items-center justify-center rounded-xl hover:bg-ink/5'
        >
          <LuMenu className='h-5 w-5' />
        </button>
      </header>

      {open && (
        <div className='fixed inset-0 z-40 lg:hidden'>
          <div className='absolute inset-0 animate-fade-in bg-ink-950/50' onClick={() => setOpen(false)} />
          <div className='relative h-full w-72 max-w-[85vw] animate-slide-in-left'>
            <Sidebar onNavigate={() => setOpen(false)} />
            <button
              type='button'
              aria-label='Close menu'
              onClick={() => setOpen(false)}
              className='absolute right-3 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-white/60 hover:bg-white/10 hover:text-white'
            >
              <LuX className='h-5 w-5' />
            </button>
          </div>
        </div>
      )}

      <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10'>
        <div key={location.pathname} className='animate-fade-up'>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default function Layout() {
  return (
    <SessionProvider>
      <Shell />
    </SessionProvider>
  );
}
