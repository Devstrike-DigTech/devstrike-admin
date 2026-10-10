import { useMemo, useState } from 'react';
import { LuExternalLink, LuFolderKanban, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import Drawer, { isDirty } from '../components/Drawer';
import { useConfirm, useToast } from '../components/feedback';
import { Row, Thumb } from '../components/Row';
import {
  Badge,
  Button,
  EmptyState,
  ErrorNote,
  Field,
  FilterTabs,
  FormSection,
  GalleryField,
  IconButton,
  ImageField,
  LinesField,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Toolbar,
} from '../components/ui';
import { api, errorMessage, resolveImage, SITE_URL } from '../lib/api';
import { matches, pick, slugify } from '../lib/format';
import { useList, useOpenNewFromQuery, useSession } from '../lib/session';
import type { Project } from '../lib/types';

type Draft = Omit<Project, 'id' | 'openVacancies'> & { id?: string };

const FIELDS = [
  'slug', 'title', 'summary', 'description', 'identity', 'motive', 'featuresIntro',
  'features', 'status', 'industry', 'websiteUrl', 'investUrl', 'coverImage', 'images',
] as const;

const EMPTY: Draft = {
  slug: '', title: '', summary: '', description: '', identity: '', motive: '',
  featuresIntro: '', features: [], status: 'ongoing', industry: '',
  websiteUrl: '', investUrl: '', coverImage: '', images: [],
};

const STATUS_TONE = { ongoing: 'green', upcoming: 'amber', concluded: 'slate' } as const;
type Filter = 'all' | Project['status'];

export default function ProjectsPage() {
  const { items, loading, error, reload } = useList<Project>('/projects?limit=50');
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [original, setOriginal] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const open = (project?: Project) => {
    const value: Draft = project ? { id: project.id, ...pick({ ...EMPTY, ...project }, FIELDS) } : { ...EMPTY };
    setOriginal(value);
    setDraft(value);
    setSaveError(null);
  };
  useOpenNewFromQuery(() => open());

  const industries = useMemo(() => [...new Set(items.map((p) => p.industry))].sort(), [items]);
  const visible = items.filter(
    (p) => (filter === 'all' || p.status === filter) && matches(query, p.title, p.industry, p.summary),
  );
  const count = (status: Filter) => (status === 'all' ? items.length : items.filter((p) => p.status === status).length);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body = JSON.stringify(pick(draft, FIELDS));
      if (draft.id) await api(`/projects/${draft.id}`, { method: 'PATCH', body });
      else await api('/projects', { method: 'POST', body });
      toast(draft.id ? `“${draft.title}” saved.` : `“${draft.title}” created.`);
      setDraft(null);
      reload();
      refreshStats();
    } catch (err) {
      setSaveError(errorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (project: Project) => {
    const roles = project.openVacancies ?? 0;
    const ok = await confirm({
      title: `Delete “${project.title}”?`,
      message: `This removes the project${roles ? ` and its ${roles} vacanc${roles === 1 ? 'y' : 'ies'}` : ''} from the website. This can't be undone.`,
      confirmLabel: 'Delete project',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/projects/${project.id}`, { method: 'DELETE' });
      toast(`“${project.title}” deleted.`);
      reload();
      refreshStats();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title='Projects'
        description='Products shown on the Projects page and home page.'
        actions={
          <Button onClick={() => open()}>
            <LuPlus className='h-4 w-4' /> New project
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
            { label: 'Ongoing', value: 'ongoing', count: count('ongoing') },
            { label: 'Upcoming', value: 'upcoming', count: count('upcoming') },
            { label: 'Concluded', value: 'concluded', count: count('concluded') },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search projects' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuFolderKanban}
          title={items.length ? 'No matching projects' : 'No projects yet'}
          description={items.length ? 'Try a different filter or search.' : 'Add your first product to show it on the website.'}
          action={!items.length && <Button onClick={() => open()}>New project</Button>}
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((project, i) => (
            <Row
              key={project.id}
              index={i}
              onOpen={() => open(project)}
              thumb={<Thumb src={resolveImage(project.coverImage)} fallback={project.title} />}
              title={project.title}
              subtitle={project.summary}
              meta={
                <>
                  <Badge tone={STATUS_TONE[project.status]} dot>
                    {project.status}
                  </Badge>
                  <Badge tone='violet'>{project.industry}</Badge>
                  {(project.openVacancies ?? 0) > 0 && (
                    <Badge tone='pink'>
                      {project.openVacancies} open role{project.openVacancies === 1 ? '' : 's'}
                    </Badge>
                  )}
                </>
              }
              actions={
                <>
                  <a
                    href={`${SITE_URL}/projects/${project.slug}`}
                    target='_blank'
                    rel='noopener noreferrer'
                    aria-label='View on site'
                    title='View on site'
                    className='hidden h-9 w-9 items-center justify-center rounded-xl text-ink/45 hover:bg-ink/[0.05] hover:text-ink sm:flex'
                  >
                    <LuExternalLink className='h-4 w-4' />
                  </a>
                  <IconButton label='Edit' onClick={() => open(project)}>
                    <LuPencil className='h-4 w-4' />
                  </IconButton>
                  <IconButton label='Delete' tone='danger' onClick={() => remove(project)}>
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
          title={draft.id ? 'Edit project' : 'New project'}
          subtitle={draft.id ? draft.title : 'Shown on the public Projects page once saved.'}
          dirty={isDirty(original, draft)}
          saving={saving}
          error={saveError}
          onClose={() => setDraft(null)}
          onSubmit={save}
          submitLabel={draft.id ? 'Save changes' : 'Create project'}
        >
          <FormSection title='Basics'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Title'>
                <input
                  className='input'
                  value={draft.title}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })
                  }
                  required
                  minLength={2}
                />
              </Field>
              <Field label='URL slug' hint={`/projects/${draft.slug || '…'}`}>
                <input className='input' value={draft.slug} onChange={(e) => set('slug', slugify(e.target.value))} required minLength={2} />
              </Field>
              <Field label='Status'>
                <select className='input' value={draft.status} onChange={(e) => set('status', e.target.value as Project['status'])}>
                  <option value='ongoing'>Ongoing</option>
                  <option value='upcoming'>Upcoming</option>
                  <option value='concluded'>Concluded</option>
                </select>
              </Field>
              <Field label='Industry' hint='Pick an existing one or type a new one.'>
                <input className='input' list='industries' value={draft.industry} onChange={(e) => set('industry', e.target.value)} required />
                <datalist id='industries'>
                  {industries.map((i) => (
                    <option key={i} value={i} />
                  ))}
                </datalist>
              </Field>
            </div>
          </FormSection>

          <FormSection title='Content' description='Text shown on the project card and detail page. Blank lines start new paragraphs.'>
            <Field label='Summary' hint={`${draft.summary.length} characters — shown on cards, aim for under 180.`}>
              <textarea className='input min-h-[80px] resize-y' value={draft.summary} onChange={(e) => set('summary', e.target.value)} required />
            </Field>
            <Field label='Description'>
              <textarea className='input min-h-[140px] resize-y leading-relaxed' value={draft.description} onChange={(e) => set('description', e.target.value)} required />
            </Field>
            <Field label='Project identity'>
              <textarea className='input min-h-[100px] resize-y leading-relaxed' value={draft.identity} onChange={(e) => set('identity', e.target.value)} />
            </Field>
            <Field label='Project motive'>
              <textarea className='input min-h-[100px] resize-y leading-relaxed' value={draft.motive} onChange={(e) => set('motive', e.target.value)} />
            </Field>
          </FormSection>

          <FormSection title='Features'>
            <Field label='Features intro'>
              <input className='input' value={draft.featuresIntro} onChange={(e) => set('featuresIntro', e.target.value)} />
            </Field>
            <LinesField label='Features' value={draft.features} onChange={(v) => set('features', v)} />
          </FormSection>

          <FormSection title='Media'>
            <ImageField label='Cover image' value={draft.coverImage} onChange={(v) => set('coverImage', v)} />
            <GalleryField label='Gallery' value={draft.images} onChange={(v) => set('images', v)} />
          </FormSection>

          <FormSection title='Links'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Website URL'>
                <input type='url' className='input' placeholder='https://' value={draft.websiteUrl ?? ''} onChange={(e) => set('websiteUrl', e.target.value)} />
              </Field>
              <Field label='Invest URL'>
                <input type='url' className='input' placeholder='https://' value={draft.investUrl ?? ''} onChange={(e) => set('investUrl', e.target.value)} />
              </Field>
            </div>
          </FormSection>
        </Drawer>
      )}
    </div>
  );
}
