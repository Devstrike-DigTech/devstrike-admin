import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
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

interface TeamMember {
  id: string;
  name: string;
  title: string;
  tier: string;
  summary: string;
  bio: string;
  responsibilitiesIntro: string;
  responsibilities: string[];
  skillsIntro: string;
  skills: string[];
  socials: Record<string, string>;
  avatarUrl?: string;
  sortOrder: number;
}

const empty: Omit<TeamMember, 'id'> = {
  name: '',
  title: '',
  tier: 'department-head',
  summary: '',
  bio: '',
  responsibilitiesIntro: '',
  responsibilities: [],
  skillsIntro: '',
  skills: [],
  socials: {},
  avatarUrl: '',
  sortOrder: 0,
};

const TIER_LABELS: Record<string, string> = {
  ceo: 'CEO',
  board: 'Board of Directors',
  'department-head': 'Department Head',
};

const socialsToLines = (socials: Record<string, string>) =>
  Object.entries(socials ?? {}).map(([k, v]) => `${k}=${v}`);

const linesToSocials = (lines: string[]) =>
  Object.fromEntries(
    lines
      .map((line) => line.split('='))
      .filter((parts) => parts.length >= 2 && parts[0].trim())
      .map(([key, ...rest]) => [key.trim().toLowerCase(), rest.join('=').trim()]),
  );

export default function TeamPage() {
  const [items, setItems] = useState<TeamMember[]>([]);
  const [editing, setEditing] = useState<Partial<TeamMember> | null>(null);
  const [socialLines, setSocialLines] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setItems(await api<TeamMember[]>('/team'));
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  const openEditor = (member: Partial<TeamMember>) => {
    setEditing(member);
    setSocialLines(socialsToLines(member.socials ?? {}));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({
        ...editing,
        id: undefined,
        socials: linesToSocials(socialLines),
        sortOrder: Number(editing.sortOrder ?? 0),
      });
      if (editing.id) {
        await api(`/team/${editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/team', { method: 'POST', body });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.name}?`)) return;
    await api(`/team/${member.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Team"
        action={<Button onClick={() => openEditor({ ...empty })}>New Member</Button>}
      />
      {!editing && <ErrorNote error={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((member) => (
              <tr key={member.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{member.name}</td>
                <td className="px-4 py-3">{member.title}</td>
                <td className="px-4 py-3">{TIER_LABELS[member.tier] ?? member.tier}</td>
                <td className="px-4 py-3">{member.sortOrder}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => openEditor(member)}>
                    Edit
                  </Button>{' '}
                  <Button variant="danger" onClick={() => remove(member)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No team members yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit Member' : 'New Member'}
          onClose={() => setEditing(null)}
        >
          <ErrorNote error={error} />
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input
                  className={inputClass}
                  value={editing.name ?? ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Title">
                <input
                  className={inputClass}
                  value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  required
                />
              </Field>
              <Field label="Tier">
                <select
                  className={inputClass}
                  value={editing.tier ?? 'department-head'}
                  onChange={(e) => setEditing({ ...editing, tier: e.target.value })}
                >
                  <option value="ceo">CEO</option>
                  <option value="board">Board of Directors</option>
                  <option value="department-head">Department Head</option>
                </select>
              </Field>
              <Field label="Sort order">
                <input
                  type="number"
                  className={inputClass}
                  value={editing.sortOrder ?? 0}
                  onChange={(e) =>
                    setEditing({ ...editing, sortOrder: Number(e.target.value) })
                  }
                />
              </Field>
            </div>

            <Field label="Summary (listing card)">
              <textarea
                className={`${inputClass} min-h-[60px]`}
                value={editing.summary ?? ''}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              />
            </Field>
            <Field label="Bio">
              <textarea
                className={`${inputClass} min-h-[90px]`}
                value={editing.bio ?? ''}
                onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
              />
            </Field>
            <LinesField
              label="Responsibilities"
              value={editing.responsibilities ?? []}
              onChange={(responsibilities) =>
                setEditing({ ...editing, responsibilities })
              }
            />
            <LinesField
              label="Skills"
              value={editing.skills ?? []}
              onChange={(skills) => setEditing({ ...editing, skills })}
            />
            <LinesField
              label="Socials (key=url)"
              value={socialLines}
              onChange={setSocialLines}
              placeholder={'twitter=https://x.com/...\nlinkedin=https://linkedin.com/in/...'}
            />
            <ImageField
              label="Avatar"
              value={editing.avatarUrl}
              onChange={(avatarUrl) => setEditing({ ...editing, avatarUrl })}
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
