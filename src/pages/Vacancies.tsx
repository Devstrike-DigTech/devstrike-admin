import { useMemo, useState } from 'react';
import {
  LuBriefcase,
  LuCircleCheck,
  LuCircleX,
  LuExternalLink,
  LuPencil,
  LuPlus,
  LuTrash2,
} from 'react-icons/lu';
import Drawer, { isDirty } from '../components/Drawer';
import { useConfirm, useToast } from '../components/feedback';
import { Row } from '../components/Row';
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
  LinesField,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Toolbar,
} from '../components/ui';
import { api, errorMessage, SITE_URL } from '../lib/api';
import { matches, pick } from '../lib/format';
import { useList, useOpenNewFromQuery, useSession } from '../lib/session';
import type { Project, Vacancy } from '../lib/types';

type Draft = Omit<Vacancy, 'id' | 'project'> & { id?: string };

const FIELDS = [
  'title', 'role', 'summary', 'fullDescription', 'responsibilitiesIntro', 'responsibilities',
  'requirementsIntro', 'requirements', 'skillSet', 'payType', 'salaryRange', 'status', 'projectId',
] as const;

const EMPTY: Draft = {
  title: '', role: '', summary: '', fullDescription: '', responsibilitiesIntro: '',
  responsibilities: [], requirementsIntro: '', requirements: [], skillSet: [],
  payType: 'Hourly', salaryRange: '', status: 'open', projectId: null,
};

const DEFAULT_ROLES = ['Backend', 'Frontend', 'Graphics', 'Native Android', 'Native iOS', 'HR', 'Marketing'];
type Filter = 'all' | Vacancy['status'];

export default function VacanciesPage() {
  const { items, loading, error, reload } = useList<Vacancy>('/vacancies/admin/all?limit=50');
  const { items: projects } = useList<Project>('/projects?limit=50');
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [original, setOriginal] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const open = (vacancy?: Vacancy) => {
    const value: Draft = vacancy
      ? { id: vacancy.id, ...pick({ ...EMPTY, ...vacancy, projectId: vacancy.projectId ?? null }, FIELDS) }
      : { ...EMPTY };
    setOriginal(value);
    setDraft(value);
    setSaveError(null);
  };
  useOpenNewFromQuery(() => open());

  const roles = useMemo(() => [...new Set([...DEFAULT_ROLES, ...items.map((v) => v.role)])].sort(), [items]);
  const visible = items.filter(
    (v) => (filter === 'all' || v.status === filter) && matches(query, v.title, v.role, v.project?.title),
  );
  const count = (f: Filter) => (f === 'all' ? items.length : items.filter((v) => v.status === f).length);
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const afterChange = () => {
    reload();
    refreshStats();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body = JSON.stringify(pick(draft, FIELDS));
      if (draft.id) await api(`/vacancies/${draft.id}`, { method: 'PATCH', body });
      else await api('/vacancies', { method: 'POST', body });
      toast(draft.id ? `“${draft.title}” saved.` : `“${draft.title}” posted.`);
      setDraft(null);
      afterChange();
    } catch (err) {
      setSaveError(errorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (vacancy: Vacancy) => {
    const next = vacancy.status === 'open' ? 'closed' : 'open';
    try {
      await api(`/vacancies/${vacancy.id}`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      toast(next === 'open' ? `“${vacancy.title}” reopened.` : `“${vacancy.title}” closed — hidden from the site.`);
      afterChange();
    } catch (err) {
      toast(errorMessage(err, 'Update failed'), 'error');
    }
  };

  const remove = async (vacancy: Vacancy) => {
    const ok = await confirm({
      title: `Delete “${vacancy.title}”?`,
      message: 'Applications already received for this role will be deleted too. To just hide it, close the role instead.',
      confirmLabel: 'Delete vacancy',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/vacancies/${vacancy.id}`, { method: 'DELETE' });
      toast(`“${vacancy.title}” deleted.`);
      afterChange();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title='Vacancies'
        description='Open roles listed on the Careers page and each project page.'
        actions={
          <Button onClick={() => open()}>
            <LuPlus className='h-4 w-4' /> New vacancy
          </Button>
        }
      />
      <ErrorNote error={error} />

      <Toolbar>
        <FilterTabs<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { label: 'All', value: 'all', count: count('all') },
            { label: 'Open', value: 'open', count: count('open') },
            { label: 'Closed', value: 'closed', count: count('closed') },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search roles' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuBriefcase}
          title={items.length ? 'No matching vacancies' : 'No vacancies yet'}
          description={items.length ? 'Try a different filter or search.' : 'Post a role to start receiving applications.'}
          action={!items.length && <Button onClick={() => open()}>New vacancy</Button>}
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((vacancy, i) => (
            <Row
              key={vacancy.id}
              index={i}
              onOpen={() => open(vacancy)}
              thumb={
                <span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary'>
                  <LuBriefcase className='h-5 w-5' />
                </span>
              }
              title={vacancy.title}
              subtitle={[vacancy.salaryRange, vacancy.payType].filter(Boolean).join(' · ')}
              meta={
                <>
                  <Badge tone={vacancy.status === 'open' ? 'green' : 'slate'} dot>
                    {vacancy.status}
                  </Badge>
                  <Badge tone='pink'>{vacancy.role}</Badge>
                  {vacancy.project ? <Badge tone='violet'>{vacancy.project.title}</Badge> : <Badge>No project</Badge>}
                </>
              }
              actions={
                <>
                  {vacancy.status === 'open' && (
                    <a
                      href={`${SITE_URL}/careers/${vacancy.id}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label='View on site'
                      title='View on site'
                      className='hidden h-9 w-9 items-center justify-center rounded-xl text-ink/45 hover:bg-ink/[0.05] hover:text-ink sm:flex'
                    >
                      <LuExternalLink className='h-4 w-4' />
                    </a>
                  )}
                  <IconButton
                    label={vacancy.status === 'open' ? 'Close role' : 'Reopen role'}
                    onClick={() => toggleStatus(vacancy)}
                  >
                    {vacancy.status === 'open' ? <LuCircleX className='h-4 w-4' /> : <LuCircleCheck className='h-4 w-4' />}
                  </IconButton>
                  <IconButton label='Edit' onClick={() => open(vacancy)}>
                    <LuPencil className='h-4 w-4' />
                  </IconButton>
                  <IconButton label='Delete' tone='danger' onClick={() => remove(vacancy)}>
                    <LuTrash2 className='h-4 w-4' />
                  </IconButton>
                </>
              }
            />
          ))}
        </ul>
      )}

      {draft && (
        <Drawer
          title={draft.id ? 'Edit vacancy' : 'New vacancy'}
          subtitle={draft.id ? draft.title : 'Open roles appear on the Careers page once saved.'}
          dirty={isDirty(original, draft)}
          saving={saving}
          error={saveError}
          onClose={() => setDraft(null)}
          onSubmit={save}
          submitLabel={draft.id ? 'Save changes' : 'Post vacancy'}
        >
          <FormSection title='Basics'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Job title' className='sm:col-span-2'>
                <input className='input' value={draft.title} onChange={(e) => set('title', e.target.value)} required minLength={2} />
              </Field>
              <Field label='Role category' hint='Used by the Careers page filter.'>
                <input className='input' list='roles' value={draft.role} onChange={(e) => set('role', e.target.value)} required />
                <datalist id='roles'>
                  {roles.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </Field>
              <Field label='Project'>
                <select className='input' value={draft.projectId ?? ''} onChange={(e) => set('projectId', e.target.value || null)}>
                  <option value=''>— No project —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label='Status'>
                <select className='input' value={draft.status} onChange={(e) => set('status', e.target.value as Vacancy['status'])}>
                  <option value='open'>Open — listed on the site</option>
                  <option value='closed'>Closed — hidden</option>
                </select>
              </Field>
              <Field label='Pay type'>
                <input className='input' list='pay-types' value={draft.payType} onChange={(e) => set('payType', e.target.value)} />
                <datalist id='pay-types'>
                  {['Hourly', 'Monthly', 'Contract', 'Project-based'].map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label='Salary range' className='sm:col-span-2'>
                <input className='input' placeholder='₦800k – ₦1.2m / month' value={draft.salaryRange} onChange={(e) => set('salaryRange', e.target.value)} />
              </Field>
            </div>
          </FormSection>

          <FormSection title='Description'>
            <Field label='Summary' hint='Shown on the role card.'>
              <textarea className='input min-h-[80px] resize-y' value={draft.summary} onChange={(e) => set('summary', e.target.value)} required />
            </Field>
            <Field label='Full job description'>
              <textarea className='input min-h-[140px] resize-y leading-relaxed' value={draft.fullDescription} onChange={(e) => set('fullDescription', e.target.value)} />
            </Field>
            <ChipsField label='Skill set' value={draft.skillSet} onChange={(v) => set('skillSet', v)} placeholder='e.g. React — press Enter to add' />
          </FormSection>

          <FormSection title='Responsibilities'>
            <Field label='Intro'>
              <input className='input' value={draft.responsibilitiesIntro} onChange={(e) => set('responsibilitiesIntro', e.target.value)} />
            </Field>
            <LinesField label='Responsibilities' value={draft.responsibilities} onChange={(v) => set('responsibilities', v)} />
          </FormSection>

          <FormSection title='Requirements'>
            <Field label='Intro'>
              <input className='input' value={draft.requirementsIntro} onChange={(e) => set('requirementsIntro', e.target.value)} />
            </Field>
            <LinesField label='Requirements' value={draft.requirements} onChange={(v) => set('requirements', v)} />
          </FormSection>
        </Drawer>
      )}
    </div>
  );
}
