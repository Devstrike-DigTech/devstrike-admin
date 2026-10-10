import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from './api';
import type { AdminProfile, AdminStats } from './types';

interface Session {
  me: AdminProfile | null;
  stats: AdminStats | null;
  /** Re-fetch dashboard counts — call after anything that changes them. */
  refreshStats: () => void;
}

const SessionContext = createContext<Session>({
  me: null,
  stats: null,
  refreshStats: () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AdminProfile | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);

  const refreshStats = useCallback(() => {
    api<AdminStats>('/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    api<AdminProfile>('/auth/me').then(setMe).catch(() => {});
    refreshStats();
    const id = window.setInterval(refreshStats, 60_000);
    return () => window.clearInterval(id);
  }, [refreshStats]);

  return (
    <SessionContext.Provider value={{ me, stats, refreshStats }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Loads a list endpoint and exposes loading/error state plus a reload function. */
export function useList<T>(path: string, select: (data: unknown) => T[] = (d) => (d as { items: T[] }).items) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      const data = await api<unknown>(path);
      setItems(select(data));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
    // `select` is expected to be a stable inline mapper; reloading on path change is enough.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { items, setItems, loading, error, reload };
}

/** Opens the "new item" editor when the page is reached via `?new=1` (dashboard quick actions). */
export function useOpenNewFromQuery(openNew: () => void) {
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    if (!params.get('new')) return;
    openNew();
    params.delete('new');
    setParams(params, { replace: true });
    // Run once on arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
