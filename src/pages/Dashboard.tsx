import { Link } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  LuArrowRight,
  LuBriefcase,
  LuFolderKanban,
  LuInbox,
  LuMail,
  LuNewspaper,
  LuPlus,
  LuUsers,
} from 'react-icons/lu';
import { Initials } from '../components/Row';
import { Badge, cx } from '../components/ui';
import { timeAgo } from '../lib/format';
import { useList, useSession } from '../lib/session';
import type { Application, ContactMessage } from '../lib/types';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({
  to,
  icon: Icon,
  label,
  value,
  detail,
  accent = false,
}: {
  to: string;
  icon: IconType;
  label: string;
  value: number | undefined;
  detail: string;
  accent?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cx(
        'group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5',
        accent ? 'bg-brand-gradient-d text-white shadow-glow' : 'card hover:shadow-lift',
      )}
    >
      <div className='flex items-start justify-between'>
        <span
          className={cx(
            'flex h-10 w-10 items-center justify-center rounded-xl',
            accent ? 'bg-white/15' : 'bg-primary/[0.08] text-primary',
          )}
        >
          <Icon className='h-5 w-5' />
        </span>
        <LuArrowRight
          className={cx(
            'h-4 w-4 transition-transform group-hover:translate-x-1',
            accent ? 'text-white/60' : 'text-ink/25',
          )}
        />
      </div>
      <p className={cx('mt-5 text-[13px] font-bold', accent ? 'text-white/70' : 'text-ink/50')}>{label}</p>
      <p className='mt-0.5 text-4xl font-extrabold tracking-tight'>
        {value ?? <span className='inline-block h-9 w-12 animate-pulse rounded-lg bg-current opacity-10' />}
      </p>
      <p className={cx('mt-1 text-[13px]', accent ? 'text-white/70' : 'text-ink/45')}>{detail}</p>
    </Link>
  );
}

function Panel({
  title,
  to,
  children,
}: {
  title: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <section className='card flex flex-col'>
      <header className='flex items-center justify-between border-b border-ink/[0.06] px-5 py-4'>
        <h2 className='font-extrabold'>{title}</h2>
        <Link to={to} className='text-[13px] font-bold text-primary hover:underline'>
          View all
        </Link>
      </header>
      <div className='flex-1'>{children}</div>
    </section>
  );
}

function PanelEmpty({ text }: { text: string }) {
  return <p className='px-5 py-10 text-center text-sm text-ink/45'>{text}</p>;
}

export default function DashboardPage() {
  const { me, stats } = useSession();
  const applications = useList<Application>('/applications?limit=5');
  const messages = useList<ContactMessage>('/contacts?limit=5');

  const quickActions = [
    { label: 'New project', to: '/projects?new=1', icon: LuFolderKanban },
    { label: 'New vacancy', to: '/vacancies?new=1', icon: LuBriefcase },
    { label: 'New post', to: '/posts?new=1', icon: LuNewspaper },
    { label: 'New team member', to: '/team?new=1', icon: LuUsers },
  ];

  return (
    <div>
      <div className='mb-8'>
        <p className='text-sm font-bold text-primary'>{greeting()},</p>
        <h1 className='mt-1 text-3xl font-extrabold tracking-tight md:text-4xl'>{me?.name ?? 'Admin'}</h1>
        <p className='mt-1.5 text-[15px] text-ink/55'>Here&apos;s what&apos;s happening across devstrike.org.</p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
        <StatCard
          to='/applications'
          icon={LuInbox}
          label='New applications'
          value={stats?.applications.new}
          detail={`${stats?.applications.total ?? '–'} received in total`}
          accent
        />
        <StatCard
          to='/messages'
          icon={LuMail}
          label='Unread messages'
          value={stats?.messages.unread}
          detail={`${stats?.messages.total ?? '–'} messages in total`}
        />
        <StatCard
          to='/vacancies'
          icon={LuBriefcase}
          label='Open roles'
          value={stats?.vacancies.open}
          detail={`${stats?.vacancies.total ?? '–'} vacancies listed`}
        />
        <StatCard
          to='/projects'
          icon={LuFolderKanban}
          label='Projects'
          value={stats?.projects.total}
          detail={`${stats?.projects.ongoing ?? '–'} ongoing`}
        />
        <StatCard
          to='/posts'
          icon={LuNewspaper}
          label='Posts'
          value={stats?.posts.total}
          detail={stats?.posts.drafts ? `${stats.posts.drafts} drafts` : 'All published'}
        />
        <StatCard
          to='/team'
          icon={LuUsers}
          label='Team members'
          value={stats?.team.total}
          detail='Shown on the Management page'
        />
      </div>

      <div className='mt-6 grid gap-6 lg:grid-cols-2'>
        <Panel title='Recent applications' to='/applications'>
          {applications.items.length === 0 ? (
            <PanelEmpty text={applications.loading ? 'Loading…' : 'No applications yet.'} />
          ) : (
            <ul className='divide-y divide-ink/[0.05]'>
              {applications.items.map((app) => (
                <li key={app.id}>
                  <Link to='/applications' className='flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface'>
                    <Initials name={app.name} />
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-bold'>{app.name}</p>
                      <p className='truncate text-[13px] text-ink/50'>{app.vacancy?.title ?? 'Unknown role'}</p>
                    </div>
                    <div className='flex flex-col items-end gap-1'>
                      {app.status === 'new' && <Badge tone='pink'>New</Badge>}
                      <span className='text-xs text-ink/40'>{timeAgo(app.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title='Recent messages' to='/messages'>
          {messages.items.length === 0 ? (
            <PanelEmpty text={messages.loading ? 'Loading…' : 'No messages yet.'} />
          ) : (
            <ul className='divide-y divide-ink/[0.05]'>
              {messages.items.map((msg) => (
                <li key={msg.id}>
                  <Link to='/messages' className='flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-surface'>
                    <Initials name={msg.name} />
                    <div className='min-w-0 flex-1'>
                      <div className='flex items-center gap-2'>
                        <p className={cx('truncate text-sm', msg.read ? 'font-semibold' : 'font-extrabold')}>{msg.name}</p>
                        <Badge tone='violet'>{msg.contactType}</Badge>
                      </div>
                      <p className='mt-0.5 line-clamp-1 text-[13px] text-ink/50'>{msg.message}</p>
                    </div>
                    <span className='shrink-0 text-xs text-ink/40'>{timeAgo(msg.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <section className='mt-6'>
        <h2 className='mb-3 text-sm font-bold uppercase tracking-[0.14em] text-ink/40'>Quick actions</h2>
        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-4'>
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className='card group flex items-center gap-3 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift'
            >
              <span className='flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-white transition-colors group-hover:bg-brand-gradient'>
                <LuPlus className='h-5 w-5' />
              </span>
              <span className='font-bold'>{action.label}</span>
              <action.icon className='ml-auto h-4 w-4 text-ink/25' />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
