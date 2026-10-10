import { useMemo, useState } from 'react';
import { LuExternalLink, LuEye, LuEyeOff, LuNewspaper, LuPencil, LuPlus, LuTrash2 } from 'react-icons/lu';
import Drawer, { isDirty } from '../components/Drawer';
import { useConfirm, useToast } from '../components/feedback';
import { Row, Thumb } from '../components/Row';
import {
  Badge,
  Button,
  cx,
  EmptyState,
  ErrorNote,
  Field,
  FilterTabs,
  FormSection,
  IconButton,
  ImageField,
  ListSkeleton,
  PageHeader,
  SearchInput,
  Toolbar,
} from '../components/ui';
import { api, errorMessage, resolveImage, SITE_URL } from '../lib/api';
import { formatDate, matches, pick, slugify } from '../lib/format';
import { useList, useOpenNewFromQuery, useSession } from '../lib/session';
import type { Post } from '../lib/types';

type Draft = Omit<Post, 'id' | 'createdAt'> & { id?: string };

const FIELDS = ['slug', 'title', 'type', 'category', 'excerpt', 'body', 'coverImage', 'published'] as const;

const EMPTY: Draft = {
  slug: '', title: '', type: 'blog', category: '', excerpt: '', body: '', coverImage: '', published: true,
};

const DEFAULT_CATEGORIES = ['AI', 'Blockchain', 'Data Science', 'Development', 'EduTech', 'FinTech'];
type Filter = 'all' | 'published' | 'drafts';

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export default function PostsPage() {
  const { items, loading, error, reload } = useList<Post>('/posts/admin/all?limit=50');
  const { refreshStats } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [original, setOriginal] = useState<Draft | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const open = (post?: Post) => {
    const value: Draft = post ? { id: post.id, ...pick({ ...EMPTY, ...post }, FIELDS) } : { ...EMPTY };
    setOriginal(value);
    setDraft(value);
    setSaveError(null);
  };
  useOpenNewFromQuery(() => open());

  const categories = useMemo(() => [...new Set([...DEFAULT_CATEGORIES, ...items.map((p) => p.category)])].sort(), [items]);
  const inFilter = (p: Post, f: Filter) => f === 'all' || (f === 'published' ? p.published : !p.published);
  const visible = items.filter((p) => inFilter(p, filter) && matches(query, p.title, p.category, p.excerpt));
  const count = (f: Filter) => items.filter((p) => inFilter(p, f)).length;
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
      if (draft.id) await api(`/posts/${draft.id}`, { method: 'PATCH', body });
      else await api('/posts', { method: 'POST', body });
      toast(draft.published ? `“${draft.title}” is live.` : `“${draft.title}” saved as a draft.`);
      setDraft(null);
      afterChange();
    } catch (err) {
      setSaveError(errorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (post: Post) => {
    try {
      await api(`/posts/${post.id}`, { method: 'PATCH', body: JSON.stringify({ published: !post.published }) });
      toast(post.published ? `“${post.title}” unpublished.` : `“${post.title}” published.`);
      afterChange();
    } catch (err) {
      toast(errorMessage(err, 'Update failed'), 'error');
    }
  };

  const remove = async (post: Post) => {
    const ok = await confirm({
      title: `Delete “${post.title}”?`,
      message: 'To just hide it from the site, unpublish it instead.',
      confirmLabel: 'Delete post',
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/posts/${post.id}`, { method: 'DELETE' });
      toast(`“${post.title}” deleted.`);
      afterChange();
    } catch (err) {
      toast(errorMessage(err, 'Delete failed'), 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title='Posts'
        description='Blogs and news shown in the Content section.'
        actions={
          <Button onClick={() => open()}>
            <LuPlus className='h-4 w-4' /> New post
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
            { label: 'Published', value: 'published', count: count('published') },
            { label: 'Drafts', value: 'drafts', count: count('drafts') },
          ]}
        />
        <SearchInput value={query} onChange={setQuery} placeholder='Search posts' />
      </Toolbar>

      {loading ? (
        <ListSkeleton />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={LuNewspaper}
          title={items.length ? 'No matching posts' : 'No posts yet'}
          description={items.length ? 'Try a different filter or search.' : 'Write your first article for the Content page.'}
          action={!items.length && <Button onClick={() => open()}>New post</Button>}
        />
      ) : (
        <ul className='space-y-2.5'>
          {visible.map((post, i) => (
            <Row
              key={post.id}
              index={i}
              onOpen={() => open(post)}
              thumb={<Thumb src={resolveImage(post.coverImage)} fallback={post.title} />}
              title={post.title}
              subtitle={post.excerpt}
              meta={
                <>
                  <Badge tone={post.published ? 'green' : 'amber'} dot>
                    {post.published ? 'Published' : 'Draft'}
                  </Badge>
                  <Badge tone='violet'>{post.type}</Badge>
                  <Badge tone='pink'>{post.category}</Badge>
                  {post.createdAt && <span className='text-xs font-semibold text-ink/35'>{formatDate(post.createdAt)}</span>}
                </>
              }
              actions={
                <>
                  {post.published && (
                    <a
                      href={`${SITE_URL}/content/${post.slug}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label='View on site'
                      title='View on site'
                      className='hidden h-9 w-9 items-center justify-center rounded-xl text-ink/45 hover:bg-ink/[0.05] hover:text-ink sm:flex'
                    >
                      <LuExternalLink className='h-4 w-4' />
                    </a>
                  )}
                  <IconButton label={post.published ? 'Unpublish' : 'Publish'} onClick={() => togglePublished(post)}>
                    {post.published ? <LuEyeOff className='h-4 w-4' /> : <LuEye className='h-4 w-4' />}
                  </IconButton>
                  <IconButton label='Edit' onClick={() => open(post)}>
                    <LuPencil className='h-4 w-4' />
                  </IconButton>
                  <IconButton label='Delete' tone='danger' onClick={() => remove(post)}>
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
          title={draft.id ? 'Edit post' : 'New post'}
          subtitle={draft.id ? draft.title : 'Publish now or keep it as a draft.'}
          dirty={isDirty(original, draft)}
          saving={saving}
          error={saveError}
          onClose={() => setDraft(null)}
          onSubmit={save}
          submitLabel={draft.published ? (draft.id ? 'Save & publish' : 'Publish post') : 'Save draft'}
        >
          <FormSection title='Basics'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <Field label='Title' className='sm:col-span-2'>
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
              <Field label='URL slug' hint={`/content/${draft.slug || '…'}`} className='sm:col-span-2'>
                <input className='input' value={draft.slug} onChange={(e) => set('slug', slugify(e.target.value))} required minLength={2} />
              </Field>
              <Field label='Type'>
                <select className='input' value={draft.type} onChange={(e) => set('type', e.target.value as Post['type'])}>
                  <option value='blog'>Blog</option>
                  <option value='news'>News</option>
                </select>
              </Field>
              <Field label='Category'>
                <input className='input' list='categories' value={draft.category} onChange={(e) => set('category', e.target.value)} required />
                <datalist id='categories'>
                  {categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
            </div>

            <button
              type='button'
              role='switch'
              aria-checked={draft.published}
              onClick={() => set('published', !draft.published)}
              className='flex w-full items-center justify-between rounded-xl border border-ink/10 px-4 py-3 text-left'
            >
              <span>
                <span className='block text-sm font-bold'>{draft.published ? 'Published' : 'Draft'}</span>
                <span className='block text-xs text-ink/50'>
                  {draft.published ? 'Visible on the website.' : 'Only visible here in the admin.'}
                </span>
              </span>
              <span className={cx('relative h-6 w-11 rounded-full transition-colors', draft.published ? 'bg-brand-gradient' : 'bg-ink/15')}>
                <span
                  className={cx(
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all',
                    draft.published ? 'left-[22px]' : 'left-0.5',
                  )}
                />
              </span>
            </button>
          </FormSection>

          <FormSection title='Content'>
            <Field label='Excerpt' hint='Shown on cards and as the article intro.'>
              <textarea className='input min-h-[80px] resize-y' value={draft.excerpt} onChange={(e) => set('excerpt', e.target.value)} required />
            </Field>
            <Field
              label='Body'
              hint={`${words(draft.body)} words · about ${Math.max(1, Math.round(words(draft.body) / 200))} min read. Separate paragraphs with a new line.`}
            >
              <textarea
                className='input min-h-[320px] resize-y text-[15px] leading-relaxed'
                value={draft.body}
                onChange={(e) => set('body', e.target.value)}
              />
            </Field>
          </FormSection>

          <FormSection title='Cover image'>
            <ImageField label='Cover' value={draft.coverImage} onChange={(v) => set('coverImage', v)} />
          </FormSection>
        </Drawer>
      )}
    </div>
  );
}
