import { useCallback, useEffect, useState } from 'react';
import { api, API_URL, getToken, Paginated } from '../lib/api';
import { Button, ErrorNote, PageHeader } from '../components/ui';

interface Application {
  id: string;
  name: string;
  email: string;
  coverNote: string;
  cvOriginalName: string;
  status: string;
  createdAt: string;
  vacancy?: { title: string };
}

export default function ApplicationsPage() {
  const [data, setData] = useState<Paginated<Application> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setData(await api<Paginated<Application>>('/applications?limit=50'));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const downloadCv = async (application: Application) => {
    const res = await fetch(`${API_URL}/api/applications/${application.id}/cv`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) {
      setError('Could not download CV');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = application.cvOriginalName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const markReviewed = async (application: Application) => {
    await api(`/applications/${application.id}/reviewed`, { method: 'PATCH' });
    await load();
  };

  return (
    <div>
      <PageHeader title="Job Applications" />
      <ErrorNote error={error} />

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((application) => (
              <>
                <tr key={application.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{application.name}</p>
                    <p className="text-xs text-gray-500">{application.email}</p>
                  </td>
                  <td className="px-4 py-3">{application.vacancy?.title ?? '—'}</td>
                  <td className="px-4 py-3">
                    {new Date(application.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        application.status === 'new'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {application.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {application.coverNote && (
                      <Button
                        variant="ghost"
                        onClick={() =>
                          setExpanded(expanded === application.id ? null : application.id)
                        }
                      >
                        Note
                      </Button>
                    )}{' '}
                    <Button variant="ghost" onClick={() => downloadCv(application)}>
                      CV
                    </Button>{' '}
                    {application.status === 'new' && (
                      <Button variant="ghost" onClick={() => markReviewed(application)}>
                        Mark reviewed
                      </Button>
                    )}
                  </td>
                </tr>
                {expanded === application.id && (
                  <tr className="border-b border-gray-50 bg-gray-50">
                    <td colSpan={5} className="px-4 py-3 text-sm text-gray-600">
                      {application.coverNote}
                    </td>
                  </tr>
                )}
              </>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
