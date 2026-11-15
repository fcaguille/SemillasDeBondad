/**
 * Minimal query/mutation cache with a TanStack-Query-compatible surface
 * ({ data, error, isLoading, isFetching, refetch } / { mutate, mutateAsync, isPending }).
 * Replace with @tanstack/react-query or Convex hooks without touching components.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Key = readonly unknown[];
interface Snapshot<T> {
  data: T | undefined;
  error: unknown;
  isFetching: boolean;
  updatedAt: number;
}
interface Entry<T> {
  snap: Snapshot<T>;
  subs: Set<() => void>;
  fn?: () => Promise<T>;
  promise?: Promise<void>;
}

const cache = new Map<string, Entry<unknown>>();
const hashKey = (k: Key) => JSON.stringify(k);

function entry<T>(h: string): Entry<T> {
  let e = cache.get(h) as Entry<T> | undefined;
  if (!e) {
    e = {
      snap: { data: undefined, error: undefined, isFetching: false, updatedAt: 0 },
      subs: new Set(),
    };
    cache.set(h, e as Entry<unknown>);
  }
  return e;
}
function patch<T>(e: Entry<T>, p: Partial<Snapshot<T>>) {
  e.snap = { ...e.snap, ...p };
  e.subs.forEach((f) => f());
}
function run<T>(e: Entry<T>) {
  if (e.promise || !e.fn) return e.promise;
  patch(e, { isFetching: true });
  e.promise = e
    .fn()
    .then(
      (data) => patch(e, { data, error: undefined, updatedAt: Date.now() }),
      (error) => patch(e, { error }),
    )
    .finally(() => {
      e.promise = undefined;
      patch(e, { isFetching: false });
    });
  return e.promise;
}

export interface QueryOptions {
  enabled?: boolean;
  /** ms before cached data is refetched on mount (default 30s) */
  staleTime?: number;
  refetchInterval?: number;
}

export function useQuery<T>(
  key: Key,
  fn: () => Promise<T>,
  { enabled = true, staleTime = 30_000, refetchInterval }: QueryOptions = {},
) {
  const h = hashKey(key);
  const e = entry<T>(h);
  e.fn = fn;
  const subscribe = useCallback(
    (cb: () => void) => {
      const en = entry<T>(h);
      en.subs.add(cb);
      return () => en.subs.delete(cb);
    },
    [h],
  );
  const snap = useSyncExternalStore(subscribe, () => entry<T>(h).snap);

  useEffect(() => {
    if (!enabled) return;
    const en = entry<T>(h);
    if (en.snap.updatedAt === 0 || Date.now() - en.snap.updatedAt > staleTime || en.snap.error) run(en);
    if (!refetchInterval) return;
    const t = setInterval(() => run(entry<T>(h)), refetchInterval);
    return () => clearInterval(t);
  }, [h, enabled, staleTime, refetchInterval]);

  return {
    data: snap.data,
    error: snap.error,
    isLoading: enabled && snap.data === undefined && !snap.error,
    isFetching: snap.isFetching,
    isError: !!snap.error,
    refetch: () => run(entry<T>(h)),
  };
}

/** Refetch every active query whose key starts with `prefix`; mark the rest stale. */
export function invalidateQueries(prefix: Key) {
  const p = hashKey(prefix).slice(0, -1);
  for (const [h, e] of cache) {
    if (!h.startsWith(p)) continue;
    e.snap = { ...e.snap, updatedAt: 0 };
    if (e.subs.size > 0) run(e);
  }
}

export function setQueryData<T>(key: Key, updater: T | ((old: T | undefined) => T)) {
  const e = entry<T>(hashKey(key));
  const data =
    typeof updater === "function" ? (updater as (o: T | undefined) => T)(e.snap.data) : updater;
  patch(e, { data, updatedAt: Date.now(), error: undefined });
}

/** Drop all cached data (e.g. on login/logout); active queries refetch immediately. */
export function clearQueries() {
  for (const e of cache.values()) {
    patch(e, { data: undefined, error: undefined, updatedAt: 0 });
    if (e.subs.size > 0) run(e);
  }
}

export function useMutation<TIn, TOut>(
  fn: (input: TIn) => Promise<TOut>,
  opts: { onSuccess?: (data: TOut, input: TIn) => void } = {},
) {
  const [state, setState] = useState<{
    isPending: boolean;
    error: unknown;
    data: TOut | undefined;
  }>({
    isPending: false,
    error: undefined,
    data: undefined,
  });
  const ref = useRef({ fn, opts });
  ref.current = { fn, opts };
  const mutateAsync = useCallback(async (input: TIn) => {
    setState((s) => ({ ...s, isPending: true, error: undefined }));
    try {
      const data = await ref.current.fn(input);
      setState({ isPending: false, error: undefined, data });
      ref.current.opts.onSuccess?.(data, input);
      return data;
    } catch (error) {
      setState({ isPending: false, error, data: undefined });
      throw error;
    }
  }, []);
  const mutate = useCallback(
    (input: TIn) => void mutateAsync(input).catch(() => {}),
    [mutateAsync],
  );
  const reset = useCallback(
    () => setState({ isPending: false, error: undefined, data: undefined }),
    [],
  );
  return { ...state, mutate, mutateAsync, reset };
}
