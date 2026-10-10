import { useState } from 'react';
import { LuMail, LuReply, LuTrash2 } from 'react-icons/lu';
import { useConfirm, useToast } from '../components/feedback';
import { Initials, Row } from '../components/Row';
import {
  Badge,
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
import { api, errorMessage } from '../lib/api';
import { formatDate, matches, timeAgo } from '../lib/format';
import { useList, useSession } from '../lib/session';
import type { ContactMessage } from '../lib/types';

type Filter = 'all' | 'unread' | ContactMessage['contactType'];

const TYPE_TONE = { enquiry: 'blue', investment: 'green', service: 'violet' } as const;

export default function MessagesPage() {
  const { items, setItems, loading, error, reload } = useList<ContactMessage>('/contacts?limit=50');
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const inFilter = (m: ContactMessage, f: Filter) =>
    f === 'all' || (f === 'unread' ? !m.read : m.contactType === f);
  const visible = items.filter((m) => inFilter(m, filter) && matches(query, m.name, m.email, m.message));
  const count = (f: Filter) => items.filter((m) => inFilter(m, f)).length;

  const toggle = async (message: ContactMessage) => {
    const opening = expanded !== message.id;
    setExpanded(opening ? message.id : null);
    if (!opening || message.read) return;
    // Opening an unread message marks it read, like an email client.
    setItems((all) => all.map((m) => (m.id === message.id ? { ...m, read: true } : m)));
    try {
      await api(`/contacts/${message.id}/read`, { method: 'PATCH' });
      refreshStats();
    } catch {
      setItems((all) => all.map((m) => (m.id === message.id ? { ...m, read: false } : m)));
    }
  };

  const remove = async (message: ContactMessage) => {
    const ok = await confirm({
      title: `Delete message from ${message.name}?`,
      confirmLabel: 'Delete message',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/contacts/${message.id}`, { method: 'DELETE' });
      toast('Message deleted.');
      reload();
      refreshStats();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader title='Messages' description='Enquiries sent through the website contact form.' />
      <ErrorNote error={error} />

      <Toolbar>
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all', count: count('all') },
            { label: 'Unread', value: 'unread', count: count('unread') },
            { label: 'Enquiry', value: 'enquiry', count: count('enquiry') },
            { label: 'Service', value: 'service', count: count('service') },
            { label: 'Investment', value: 'investment', count: count('investment') },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search messages' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuMail}
          title={items.length ? 'No matching messages' : 'Inbox zero'}
          description={items.length ? 'Try a different filter or search.' : 'Messages from the website contact form will land here.'}
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((message, i) => {
            const isOpen = expanded === message.id;
            const mailto = `mailto:${message.email}?subject=${encodeURIComponent('Re: your message to Devstrike')}`;
            return (
              <Row
                key={message.id}
                index={i}
                highlight={!message.read}
                onOpen={() => toggle(message)}
                thumb={<Initials name={message.name} />}
                title={message.name}
                subtitle={isOpen ? message.email : message.message}
                meta={
                  <>
                    <Badge tone={TYPE_TONE[message.contactType] ?? 'slate'}>{message.contactType}</Badge>
                    <span className='text-xs font-semibold text-ink/40' title={formatDate(message.createdAt)}>
                      {timeAgo(message.createdAt)}
                    </span>
                  </>
                }
                actions={
                  <>
                    <a href={mailto} aria-label='Reply by email' title='Reply by email' className={buttonClass('ghost', 'sm') + ' !h-9 !w-9 !p-0'}>
                      <LuReply className='h-4 w-4' />
                    </a>
                    <IconButton label='Delete' tone='danger' onClick={() => remove(message)}>
                      <LuTrash2 className='h-4 w-4' />
                    </IconButton>
                  </>
                }
              >
                {isOpen && (
                  <div className='animate-fade-in border-t border-ink/[0.06] bg-surface/60 px-4 py-5 sm:px-6'>
                    <p className='whitespace-pre-line text-[15px] leading-relaxed text-ink/80'>{message.message}</p>
                    <a href={mailto} className={buttonClass('primary', 'sm') + ' mt-5'}>
                      <LuReply className='h-3.5 w-3.5' /> Reply to {message.name.split(' ')[0]}
                    </a>
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
