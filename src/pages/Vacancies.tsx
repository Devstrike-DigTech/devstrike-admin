import { useCallback, useEffect, useState } from 'react';
import { api, Paginated } from '../lib/api';
import {
  Button,
  ErrorNote,
  Field,
  LinesField,
  Modal,
  PageHeader,
  inputClass,
} from '../components/ui';

interface Vacancy {
  id: string;
  title: string;
  role: string;
  summary: string;
  fullDescription: string;
  responsibilitiesIntro: string;
  responsibilities: string[];
  requirementsIntro: string;
  requirements: string[];
  skillSet: string[];
  payType: string;
  salaryRange: string;
  status: string;
  projectId?: string;
  project?: { id: string; title: string };
}

interface ProjectOption {
  id: string;
  title: string;
}

const empty: Omit<Vacancy, 'id'> = {
  title: '',
  role: 'Backend',
  summary: '',
  fullDescription: '',
  responsibilitiesIntro: '',
  responsibilities: [],
  requirementsIntro: '',
  requirements: [],
  skillSet: [],
  payType: 'Hourly',
  salaryRange: '',
  status: 'open',
  projectId: undefined,
};

const ROLES = ['Backend', 'Frontend', 'Graphics', 'Native Android', 'Native iOS', 'HR', 'Marketing'];

export default function VacanciesPage() {
  const [data, setData] = useState<Paginated<Vacancy> | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [editing, setEditing] = useState<Partial<Vacancy> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [vacancies, projectList] = await Promise.all([
      api<Paginated<Vacancy>>('/vacancies/admin/all?limit=50'),
      api<Paginated<ProjectOption>>('/projects?limit=50'),
    ]);
    setData(vacancies);
    setProjects(projectList.items);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({
        ...editing,
        id: undefined,
        project: undefined,
        projectId: editing.projectId || undefined,
      });
      if (editing.id) {
        await api(`/vacancies/${editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/vacancies', { method: 'POST', body });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (vacancy: Vacancy) => {
    if (!confirm(`Delete "${vacancy.title}"?`)) return;
    await api(`/vacancies/${vacancy.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Vacancies"
        action={<Button onClick={() => setEditing({ ...empty })}>New Vacancy</Button>}
      />
      {!editing && <ErrorNote error={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((vacancy) => (
              <tr key={vacancy.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{vacancy.title}</td>
                <td className="px-4 py-3">{vacancy.role}</td>
                <td className="px-4 py-3">{vacancy.project?.title ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      vacancy.status === 'open'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {vacancy.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setEditing(vacancy)}>
                    Edit
                  </Button>{' '}
                  <Button variant="danger" onClick={() => remove(vacancy)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No vacancies yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit Vacancy' : 'New Vacancy'}
          onClose={() => setEditing(null)}
        >
          <ErrorNote error={error} />
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="Role category">
                <select
                  className={inputClass}
                  value={editing.role ?? 'Backend'}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Project">
                <select
                  className={inputClass}
                  value={editing.projectId ?? ''}
                  onChange={(e) =>
                    setEditing({ ...editing, projectId: e.target.value || undefined })
                  }
                >
                  <option value="">— None —</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={editing.status ?? 'open'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </Field>
              <Field label="Pay type">
                <input
                  className={inputClass}
                  value={editing.payType ?? ''}
                  onChange={(e) => setEditing({ ...editing, payType: e.target.value })}
                />
              </Field>
              <Field label="Salary range">
                <input
                  className={inputClass}
                  value={editing.salaryRange ?? ''}
                  onChange={(e) => setEditing({ ...editing, salaryRange: e.target.value })}
                  placeholder="₦800k – ₦1.2m / month"
                />
              </Field>
            </div>

            <Field label="Summary (card blurb)">
              <textarea
                className={`${inputClass} min-h-[60px]`}
                value={editing.summary ?? ''}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                required
              />
            </Field>
            <Field label="Full job description">
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={editing.fullDescription ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, fullDescription: e.target.value })
                }
              />
            </Field>
            <LinesField
              label="Skill set"
              value={editing.skillSet ?? []}
              onChange={(skillSet) => setEditing({ ...editing, skillSet })}
              placeholder={'JavaScript\nReact.js\nNode.js'}
            />
            <Field label="Responsibilities intro">
              <input
                className={inputClass}
                value={editing.responsibilitiesIntro ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, responsibilitiesIntro: e.target.value })
                }
              />
            </Field>
            <LinesField
              label="Responsibilities"
              value={editing.responsibilities ?? []}
              onChange={(responsibilities) =>
                setEditing({ ...editing, responsibilities })
              }
            />
            <Field label="Requirements intro">
              <input
                className={inputClass}
                value={editing.requirementsIntro ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, requirementsIntro: e.target.value })
                }
              />
            </Field>
            <LinesField
              label="Requirements"
              value={editing.requirements ?? []}
              onChange={(requirements) => setEditing({ ...editing, requirements })}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
