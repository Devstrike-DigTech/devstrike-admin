import { useCallback, useEffect, useState } from 'react';
import { api, Paginated } from '../lib/api';
import { Button, ErrorNote, PageHeader } from '../components/ui';

interface Message {
  id: string;
  contactType: string;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [data, setData] = useState<Paginated<Message> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(await api<Paginated<Message>>('/contacts?limit=50'));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const markRead = async (message: Message) => {
    await api(`/contacts/${message.id}/read`, { method: 'PATCH' });
    await load();
  };

  const remove = async (message: Message) => {
    if (!confirm(`Delete message from ${message.name}?`)) return;
    await api(`/contacts/${message.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <PageHeader title="Contact Messages" />
      <ErrorNote error={error} />

      <div className="space-y-3">
        {data?.items.map((message) => (
          <div
            key={message.id}
            className={`rounded-xl border bg-white p-4 ${
              message.read ? 'border-gray-200' : 'border-primary/40'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{message.name}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                    {message.contactType}
                  </span>
                  {!message.read && (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      new
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {message.email} · {new Date(message.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!message.read && (
                  <Button variant="ghost" onClick={() => markRead(message)}>
                    Mark read
                  </Button>
                )}
                <Button variant="danger" onClick={() => remove(message)}>
                  Delete
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              {message.message}
            </p>
          </div>
        ))}
        {data && data.items.length === 0 && (
          <p className="rounded-xl border border-gray-200 bg-white px-4 py-10 text-center text-gray-500">
            No messages yet.
          </p>
        )}
      </div>
    </div>
  );
}
