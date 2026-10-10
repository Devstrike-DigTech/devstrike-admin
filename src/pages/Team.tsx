import { useState } from 'react';
import { LuExternalLink, LuPencil, LuPlus, LuTrash2, LuUsers } from 'react-icons/lu';
import Drawer, { isDirty } from '../components/Drawer';
import { useConfirm, useToast } from '../components/feedback';
import { Initials, Row } from '../components/Row';
import {
  Badge,
  Button,
  ChipsField,
  EmptyState,
  ErrorNote,
  Field,
  FilterTabs,
  FormSection,
  IconButton,
  ImageField,
  LinesField,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Toolbar,
} from '../components/ui';
import { api, errorMessage, resolveImage, SITE_URL } from '../lib/api';
import { matches, pick } from '../lib/format';
import { useList, useOpenNewFromQuery, useSession } from '../lib/session';
import type { TeamMember } from '../lib/types';

type Draft = Omit<TeamMember, 'id'> & { id?: string };

const FIELDS = [
  'name', 'title', 'tier', 'summary', 'bio', 'responsibilitiesIntro', 'responsibilities',
  'skillsIntro', 'skills', 'socials', 'avatarUrl', 'sortOrder',
] as const;

const EMPTY: Draft = {
  name: '', title: '', tier: 'department-head', summary: '', bio: '', responsibilitiesIntro: '',
  responsibilities: [], skillsIntro: '', skills: [], socials: {}, avatarUrl: '', sortOrder: 0,
};

const TIERS: { value: TeamMember['tier']; label: string; tone: 'pink' | 'violet' | 'slate' }[] = [
  { value: 'ceo', label: 'CEO', tone: 'pink' },
  { value: 'board', label: 'Board of Directors', tone: 'violet' },
  { value: 'department-head', label: 'Department Head', tone: 'slate' },
];

const SOCIALS = [
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/…' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/…' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/…' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/…' },
  { key: 'dribbble', label: 'Dribbble', placeholder: 'https://dribbble.com/…' },
];

type Filter = 'all' | TeamMember['tier'];

export default function TeamPage() {
  const { items, loading, error, reload } = useList<TeamMember>('/team', (d) => d as TeamMember[]);
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [original, setOriginal] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const open = (member?: TeamMember) => {
    const value: Draft = member
      ? { id: member.id, ...pick({ ...EMPTY, ...member, socials: { ...(member.socials ?? {}) } }, FIELDS) }
      : { ...EMPTY, sortOrder: items.length };
    setOriginal(value);
    setDraft(value);
    setSaveError(null);
  };
  useOpenNewFromQuery(() => open());

  const visible = items.filter((m) => (filter === 'all' || m.tier === filter) && matches(query, m.name, m.title));
  const count = (f: Filter) => (f === 'all' ? items.length : items.filter((m) => m.tier === f).length);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const socials = Object.fromEntries(Object.entries(draft.socials).filter(([, url]) => url.trim()));
      const body = JSON.stringify({ ...pick(draft, FIELDS), socials, sortOrder: Number(draft.sortOrder) || 0 });
      if (draft.id) await api(`/team/${draft.id}`, { method: 'PATCH', body });
      else await api('/team', { method: 'POST', body });
      toast(draft.id ? `${draft.name}'s profile saved.` : `${draft.name} added to the team.`);
      setDraft(null);
      reload();
      refreshStats();
    } catch (err) {
      setSaveError(errorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (member: TeamMember) => {
    const ok = await confirm({
      title: `Remove ${member.name}?`,
      message: 'Their profile will disappear from the Management page.',
      confirmLabel: 'Remove member',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/team/${member.id}`, { method: 'DELETE' });
      toast(`${member.name} removed.`);
      reload();
      refreshStats();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title='Team'
        description='Leadership profiles shown on the Careers → Management page.'
        actions={
          <Button onClick={() => open()}>
            <LuPlus className='h-4 w-4' /> New member
          </Button>
        }
      />
      <ErrorNote error={error} />

      <Toolbar>
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[{ label: 'All', value: 'all', count: count('all') }, ...TIERS.map((t) => ({ label: t.label, value: t.value, count: count(t.value) }))]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search people' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuUsers}
          title={items.length ? 'No matching people' : 'No team members yet'}
          description={items.length ? 'Try a different filter or search.' : 'Add your leadership team to the Management page.'}
          action={!items.length && <Button onClick={() => open()}>New member</Button>}
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((member, i) => {
            const tier = TIERS.find((t) => t.value === member.tier);
            return (
              <Row
                key={member.id}
                index={i}
                onOpen={() => open(member)}
                thumb={<Initials name={member.name} src={resolveImage(member.avatarUrl)} />}
                title={member.name}
                subtitle={member.title}
                meta={
                  <>
                    <Badge tone={tier?.tone ?? 'slate'}>{tier?.label ?? member.tier}</Badge>
                    <span className='text-xs font-semibold text-ink/35'>Order {member.sortOrder}</span>
                  </>
                }
                actions={
                  <>
                    <a
                      href={`${SITE_URL}/careers/management/${member.id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label='View on site'
                      title='View on site'
                      className='hidden h-9 w-9 items-center justify-center rounded-xl text-ink/45 hover:bg-ink/[0.05] hover:text-ink sm:flex'
                    >
                      <LuExternalLink className='h-4 w-4' />
                    </a>
                    <IconButton label='Edit' onClick={() => open(member)}>
                      <LuPencil className='h-4 w-4' />
                    </IconButton>
                    <IconButton label='Delete' tone='danger' onClick={() => remove(member)}>
                      <LuTrash2 className='h-4 w-4' />
                    </IconButton>
                  </>
                }
              />
            );
          })}
        </ul>
      )}

      {draft && (
        <Drawer
          title={draft.id ? 'Edit member' : 'New team member'}
          subtitle={draft.id ? draft.name : 'Appears on the Management page once saved.'}
          dirty={isDirty(original, draft)}
          saving={saving}
          error={saveError}
          onClose={() => setDraft(null)}
          onSubmit={save}
          submitLabel={draft.id ? 'Save changes' : 'Add member'}
        >
          <FormSection title='Profile'>
            <div className='grid gap-4 sm:grid-cols-[160px_1fr]'>
              <ImageField label='Photo' value={draft.avatarUrl} onChange={(v) => set('avatarUrl', v)} aspect='aspect-square' />
              <div className='space-y-4'>
                <Field label='Full name'>
                  <input className='input' value={draft.name} onChange={(e) => set('name', e.target.value)} required minLength={2} />
                </Field>
                <Field label='Job title'>
                  <input className='input' value={draft.title} onChange={(e) => set('title', e.target.value)} required minLength={2} />
                </Field>
                <div className='grid grid-cols-2 gap-4'>
                  <Field label='Group'>
                    <select className='input' value={draft.tier} onChange={(e) => set('tier', e.target.value as TeamMember['tier'])}>
                      {TIERS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label='Display order' hint='Lower comes first.'>
                    <input type='number' className='input' value={draft.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
                  </Field>
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title='About'>
            <Field label='Summary' hint='Shown on the listing card.'>
              <textarea className='input min-h-[80px] resize-y' value={draft.summary} onChange={(e) => set('summary', e.target.value)} />
            </Field>
            <Field label='Bio'>
              <textarea className='input min-h-[140px] resize-y leading-relaxed' value={draft.bio} onChange={(e) => set('bio', e.target.value)} />
            </Field>
          </FormSection>

          <FormSection title='Responsibilities & skills'>
            <Field label='Responsibilities intro'>
              <input className='input' value={draft.responsibilitiesIntro} onChange={(e) => set('responsibilitiesIntro', e.target.value)} />
            </Field>
            <LinesField label='Responsibilities' value={draft.responsibilities} onChange={(v) => set('responsibilities', v)} />
            <Field label='Skills intro'>
              <input className='input' value={draft.skillsIntro} onChange={(e) => set('skillsIntro', e.target.value)} />
            </Field>
            <ChipsField label='Skills' value={draft.skills} onChange={(v) => set('skills', v)} />
          </FormSection>

          <FormSection title='Social links' description='Leave blank to hide.'>
            <div className='grid gap-4 sm:grid-cols-2'>
              {SOCIALS.map((s) => (
                <Field key={s.key} label={s.label}>
                  <input
                    type='url'
                    className='input'
                    placeholder={s.placeholder}
                    value={draft.socials[s.key] ?? ''}
                    onChange={(e) => set('socials', { ...draft.socials, [s.key]: e.target.value })}
                  />
                </Field>
              ))}
            </div>
          </FormSection>
        </Drawer>
      )}
    </div>
  );
}
