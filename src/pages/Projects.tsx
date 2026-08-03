import { useCallback, useEffect, useState } from 'react';
import { api, Paginated } from '../lib/api';
import {
  Button,
  ErrorNote,
  Field,
  ImageField,
  LinesField,
  Modal,
  PageHeader,
  inputClass,
} from '../components/ui';

interface Project {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  identity: string;
  motive: string;
  featuresIntro: string;
  features: string[];
  status: string;
  industry: string;
  websiteUrl?: string;
  investUrl?: string;
  coverImage?: string;
  images: string[];
  openVacancies?: number;
}

const empty: Omit<Project, 'id'> = {
  slug: '',
  title: '',
  summary: '',
  description: '',
  identity: '',
  motive: '',
  featuresIntro: '',
  features: [],
  status: 'ongoing',
  industry: 'Technology',
  websiteUrl: '',
  investUrl: '',
  coverImage: '',
  images: [],
};

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function ProjectsPage() {
  const [data, setData] = useState<Paginated<Project> | null>(null);
  const [editing, setEditing] = useState<Partial<Project> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setData(await api<Paginated<Project>>('/projects?limit=50'));
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
      const body = JSON.stringify({ ...editing, id: undefined, openVacancies: undefined });
      if (editing.id) {
        await api(`/projects/${editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/projects', { method: 'POST', body });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (project: Project) => {
    if (!confirm(`Delete "${project.title}" and its vacancies?`)) return;
    await api(`/projects/${project.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Projects"
        action={<Button onClick={() => setEditing({ ...empty })}>New Project</Button>}
      />
      {!editing && <ErrorNote error={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Industry</th>
              <th className="px-4 py-3">Open roles</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((project) => (
              <tr key={project.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{project.title}</td>
                <td className="px-4 py-3 capitalize">{project.status}</td>
                <td className="px-4 py-3">{project.industry}</td>
                <td className="px-4 py-3">{project.openVacancies ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setEditing(project)}>
                    Edit
                  </Button>{' '}
                  <Button variant="danger" onClick={() => remove(project)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No projects yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit Project' : 'New Project'}
          onClose={() => setEditing(null)}
        >
          <ErrorNote error={error} />
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title">
                <input
                  className={inputClass}
                  value={editing.title ?? ''}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      title: e.target.value,
                      slug: editing.id ? editing.slug : slugify(e.target.value),
                    })
                  }
                  required
                />
              </Field>
              <Field label="Slug">
                <input
                  className={inputClass}
                  value={editing.slug ?? ''}
                  onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  required
                />
              </Field>
              <Field label="Status">
                <select
                  className={inputClass}
                  value={editing.status ?? 'ongoing'}
                  onChange={(e) => setEditing({ ...editing, status: e.target.value })}
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="concluded">Concluded</option>
                </select>
              </Field>
              <Field label="Industry">
                <input
                  className={inputClass}
                  value={editing.industry ?? ''}
                  onChange={(e) => setEditing({ ...editing, industry: e.target.value })}
                />
              </Field>
              <Field label="Website URL">
                <input
                  className={inputClass}
                  value={editing.websiteUrl ?? ''}
                  onChange={(e) => setEditing({ ...editing, websiteUrl: e.target.value })}
                />
              </Field>
              <Field label="Invest URL">
                <input
                  className={inputClass}
                  value={editing.investUrl ?? ''}
                  onChange={(e) => setEditing({ ...editing, investUrl: e.target.value })}
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
            <Field label="Description (detail page intro)">
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                required
              />
            </Field>
            <Field label="Project Identity">
              <textarea
                className={`${inputClass} min-h-[70px]`}
                value={editing.identity ?? ''}
                onChange={(e) => setEditing({ ...editing, identity: e.target.value })}
              />
            </Field>
            <Field label="Project Motive">
              <textarea
                className={`${inputClass} min-h-[70px]`}
                value={editing.motive ?? ''}
                onChange={(e) => setEditing({ ...editing, motive: e.target.value })}
              />
            </Field>
            <Field label="Features intro">
              <input
                className={inputClass}
                value={editing.featuresIntro ?? ''}
                onChange={(e) => setEditing({ ...editing, featuresIntro: e.target.value })}
              />
            </Field>
            <LinesField
              label="Features"
              value={editing.features ?? []}
              onChange={(features) => setEditing({ ...editing, features })}
            />
            <ImageField
              label="Cover image"
              value={editing.coverImage}
              onChange={(coverImage) => setEditing({ ...editing, coverImage })}
            />
            <LinesField
              label="Gallery image URLs"
              value={editing.images ?? []}
              onChange={(images) => setEditing({ ...editing, images })}
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
