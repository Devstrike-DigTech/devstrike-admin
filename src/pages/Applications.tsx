import { useState } from 'react';
import { LuCheck, LuDownload, LuInbox, LuReply, LuTrash2 } from 'react-icons/lu';
import { useConfirm, useToast } from '../components/feedback';
import { Initials, Row } from '../components/Row';
import {
  Badge,
  Button,
  buttonClass,
  EmptyState,
  ErrorNote,
  FilterTabs,
  IconButton,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Toolbar,
} from '../components/ui';
import { api, API_URL, errorMessage, getToken } from '../lib/api';
import { formatDate, matches, timeAgo } from '../lib/format';
import { useList, useSession } from '../lib/session';
import type { Application } from '../lib/types';

type Filter = 'all' | Application['status'];

export default function ApplicationsPage() {
  const { items, setItems, loading, error, reload } = useList<Application>('/applications?limit=50');
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const visible = items.filter(
    (a) => (filter === 'all' || a.status === filter) && matches(query, a.name, a.email, a.vacancy?.title),
  );
  const count = (f: Filter) => (f === 'all' ? items.length : items.filter((a) => a.status === f).length);

  const downloadCv = async (application: Application) => {
    setDownloading(application.id);
    try {
      const res = await fetch(`${API_URL}/api/applications/${application.id}/cv`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error(res.status === 404 ? 'CV file not found on the server' : 'Could not download CV');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = application.cvOriginalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(errorMessage(err, 'Could not download CV'), 'error');
    } finally {
      setDownloading(null);
    }
  };

  const markReviewed = async (application: Application) => {
    try {
      await api(`/applications/${application.id}/reviewed`, { method: 'PATCH' });
      setItems((all) => all.map((a) => (a.id === application.id ? { ...a, status: 'reviewed' } : a)));
      toast(`${application.name}'s application marked as reviewed.`);
      refreshStats();
    } catch (err) {
      toast(errorMessage(err, 'Update failed'), 'error');
    }
  };

  const remove = async (application: Application) => {
    const ok = await confirm({
      title: `Delete ${application.name}'s application?`,
      message: 'The application and its CV record will be removed.',
      confirmLabel: 'Delete application',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/applications/${application.id}`, { method: 'DELETE' });
      toast('Application deleted.');
      reload();
      refreshStats();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader title='Applications' description='Job applications submitted through the Careers pages.' />
      <ErrorNote error={error} />

      <Toolbar>
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all', count: count('all') },
            { label: 'New', value: 'new', count: count('new') },
            { label: 'Reviewed', value: 'reviewed', count: count('reviewed') },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search name, email, role' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuInbox}
          title={items.length ? 'No matching applications' : 'No applications yet'}
          description={
            items.length ? 'Try a different filter or search.' : 'Applications appear here as soon as someone applies for an open role.'
          }
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((app, i) => {
            const isOpen = expanded === app.id;
            const mailto = `mailto:${app.email}?subject=${encodeURIComponent(
              `Your application for ${app.vacancy?.title ?? 'a role'} at Devstrike`,
            )}`;
            return (
              <Row
                key={app.id}
                index={i}
                highlight={app.status === 'new'}
                onOpen={() => setExpanded(isOpen ? null : app.id)}
                thumb={<Initials name={app.name} />}
                title={app.name}
                subtitle={`${app.vacancy?.title ?? 'Unknown role'} · ${app.email}`}
                meta={
                  <>
                    <Badge tone={app.status === 'new' ? 'pink' : 'slate'} dot>
                      {app.status}
                    </Badge>
                    <span className='text-xs font-semibold text-ink/40' title={formatDate(app.createdAt)}>
                      {timeAgo(app.createdAt)}
                    </span>
                  </>
                }
                actions={
                  <>
                    <IconButton label='Download CV' onClick={() => downloadCv(app)} disabled={downloading === app.id}>
                      <LuDownload className='h-4 w-4' />
                    </IconButton>
                    {app.status === 'new' && (
                      <IconButton label='Mark reviewed' onClick={() => markReviewed(app)}>
                        <LuCheck className='h-4 w-4' />
                      </IconButton>
                    )}
                    <IconButton label='Delete' tone='danger' onClick={() => remove(app)}>
                      <LuTrash2 className='h-4 w-4' />
                    </IconButton>
                  </>
                }
              >
                {isOpen && (
                  <div className='animate-fade-in border-t border-ink/[0.06] bg-surface/60 px-4 py-5 sm:px-6'>
                    <p className='text-[11px] font-bold uppercase tracking-[0.14em] text-ink/40'>Cover note</p>
                    <p className='mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink/75'>
                      {app.coverNote || <span className='italic text-ink/40'>No cover note provided.</span>}
                    </p>
                    <div className='mt-5 flex flex-wrap gap-2'>
                      <Button variant='secondary' size='sm' onClick={() => downloadCv(app)} loading={downloading === app.id}>
                        <LuDownload className='h-3.5 w-3.5' /> {app.cvOriginalName}
                      </Button>
                      <a href={mailto} className={buttonClass('secondary', 'sm')}>
                        <LuReply className='h-3.5 w-3.5' /> Email applicant
                      </a>
                      {app.status === 'new' && (
                        <Button size='sm' onClick={() => markReviewed(app)}>
                          <LuCheck className='h-3.5 w-3.5' /> Mark reviewed
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Row>
            );
          })}
        </ul>
      )}
    </div>
  );
}
