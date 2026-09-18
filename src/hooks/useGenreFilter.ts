import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

// Shared, URL-backed genre selection. Any component in the same route tree
// (Still Fresh's bar, Archive's bar) can call this independently and stay in
// sync automatically, since `useSearchParams` reads the same router state.
export function useGenreFilter() {
    const [params, setParams] = useSearchParams();
    const raw = params.get('genre') ?? '';

    // Memoized on the raw string, not on `params` itself, so callers doing
    // useMemo(() => ..., [selected]) elsewhere actually skip recomputation
    // when the selection hasn't changed.
    const selected = useMemo(
        () => raw.split(',').map(s => s.trim()).filter(Boolean),
        [raw]
    );

    const commit = useCallback((slugs: string[]) => {
        // Alphabetical, deduped — so the same selection always serializes to
        // the same URL regardless of click order (stable for sharing/back-nav).
        const ordered = Array.from(new Set(slugs.filter(Boolean))).sort();
        setParams(prev => {
            const next = new URLSearchParams(prev);
            if (ordered.length) next.set('genre', ordered.join(','));
            else next.delete('genre');
            return next;
        }, { replace: true });
    }, [setParams]);

    const toggle = useCallback((slug: string) => {
        commit(selected.includes(slug) ? selected.filter(s => s !== slug) : [...selected, slug]);
    }, [selected, commit]);

    const clear = useCallback(() => commit([]), [commit]);

    return { selected, toggle, clear, commit, active: selected.length > 0 };
}
