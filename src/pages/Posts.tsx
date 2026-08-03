import { useCallback, useEffect, useState } from 'react';
import { api, Paginated } from '../lib/api';
import {
  Button,
  ErrorNote,
  Field,
  ImageField,
  Modal,
  PageHeader,
  inputClass,
} from '../components/ui';

interface Post {
  id: string;
  slug: string;
  title: string;
  type: string;
  category: string;
  excerpt: string;
  body: string;
  coverImage?: string;
  published: boolean;
}

const empty: Omit<Post, 'id'> = {
  slug: '',
  title: '',
  type: 'blog',
  category: 'Development',
  excerpt: '',
  body: '',
  coverImage: '',
  published: true,
};

const CATEGORIES = ['AI', 'Data Science', 'Development', 'Blockchain', 'FinTech', 'EduTech'];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function PostsPage() {
  const [data, setData] = useState<Paginated<Post> | null>(null);
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setData(await api<Paginated<Post>>('/posts/admin/all?limit=50'));
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
      const body = JSON.stringify({ ...editing, id: undefined });
      if (editing.id) {
        await api(`/posts/${editing.id}`, { method: 'PATCH', body });
      } else {
        await api('/posts', { method: 'POST', body });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (post: Post) => {
    if (!confirm(`Delete "${post.title}"?`)) return;
    await api(`/posts/${post.id}`, { method: 'DELETE' });
    await load();
  };

  return (
    <div>
      <PageHeader
        title="Posts"
        action={<Button onClick={() => setEditing({ ...empty })}>New Post</Button>}
      />
      {!editing && <ErrorNote error={error} />}

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {data?.items.map((post) => (
              <tr key={post.id} className="border-b border-gray-50">
                <td className="px-4 py-3 font-medium">{post.title}</td>
                <td className="px-4 py-3 capitalize">{post.type}</td>
                <td className="px-4 py-3">{post.category}</td>
                <td className="px-4 py-3">{post.published ? 'Yes' : 'Draft'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" onClick={() => setEditing(post)}>
                    Edit
                  </Button>{' '}
                  <Button variant="danger" onClick={() => remove(post)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {data && data.items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No posts yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal
          title={editing.id ? 'Edit Post' : 'New Post'}
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
              <Field label="Type">
                <select
                  className={inputClass}
                  value={editing.type ?? 'blog'}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                >
                  <option value="blog">Blog</option>
                  <option value="news">News</option>
                </select>
              </Field>
              <Field label="Category">
                <select
                  className={inputClass}
                  value={editing.category ?? 'Development'}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Excerpt">
              <textarea
                className={`${inputClass} min-h-[60px]`}
                value={editing.excerpt ?? ''}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                required
              />
            </Field>
            <Field label="Body">
              <textarea
                className={`${inputClass} min-h-[200px]`}
                value={editing.body ?? ''}
                onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              />
            </Field>
            <ImageField
              label="Cover image"
              value={editing.coverImage}
              onChange={(coverImage) => setEditing({ ...editing, coverImage })}
            />
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={editing.published ?? true}
                onChange={(e) => setEditing({ ...editing, published: e.target.checked })}
              />
              Published
            </label>

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
