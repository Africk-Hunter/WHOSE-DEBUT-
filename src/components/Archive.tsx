import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ArchiveEntry from './ArchiveEntry';
import { getParsedLocalStorage, getParsedGenres } from '../utilities/localStorageHandling';
import { albumGenres, computeAvailableGenres, GenreSlug } from '../utilities/genres';
import { Album } from '../utilities/types';
import { useGenreFilter } from '../hooks/useGenreFilter';
import GenreFilterBar from './GenreFilterBar';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

function getYear(album: Album): string {
    return album.year_released.slice(0, 4);
}

function getMonthIndex(album: Album): number {
    return parseInt(album.year_released.slice(5, 7), 10) - 1;
}

interface MonthBucket {
    month: string;
    all: Album[];
    matched: Album[];
}

interface YearBucket {
    year: string;
    months: MonthBucket[];
    total: number;
    matched: number;
}

// Groups an already rank-14+ pool into year -> month buckets, with a
// match count against the current genre selection. Year rows always keep
// their full "total" so a year never disappears under a filter; a month
// keeps its `all` list too so an empty-match month can still report it once
// had albums, rather than being indistinguishable from a month that never
// existed.
function buildBuckets(pool: Album[], selected: GenreSlug[]): YearBucket[] {
    const active = selected.length > 0;
    const isMatch = (a: Album) => !active || albumGenres(a).some(g => selected.includes(g));

    const years = new Map<string, Album[]>();
    for (const album of pool) {
        const y = getYear(album);
        if (!years.has(y)) years.set(y, []);
        years.get(y)!.push(album);
    }

    const sortedYears = Array.from(years.keys()).sort((a, b) => Number(b) - Number(a));

    return sortedYears.map(year => {
        const yearAlbums = years.get(year)!;
        const monthsMap = new Map<number, Album[]>();
        for (const album of yearAlbums) {
            const mi = getMonthIndex(album);
            if (!monthsMap.has(mi)) monthsMap.set(mi, []);
            monthsMap.get(mi)!.push(album);
        }

        const months: MonthBucket[] = Array.from(monthsMap.keys())
            .sort((a, b) => b - a)
            .map(mi => {
                const all = monthsMap.get(mi)!;
                return { month: MONTH_NAMES[mi], all, matched: all.filter(isMatch) };
            });

        return {
            year,
            months,
            total: yearAlbums.length,
            matched: yearAlbums.filter(isMatch).length,
        };
    });
}

const Archive: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [genreLabels, setGenreLabels] = useState<Record<string, string>>({});
    const [showBack, setShowBack] = useState(false);

    // Latched, not derived: `useGenreFilter`'s commit() replaces the URL/state
    // on every in-page filter toggle, which would otherwise wipe this as soon
    // as the user touches a genre chip inside the Archive itself.
    useEffect(() => {
        if ((location.state as { fromGenreChip?: boolean } | null)?.fromGenreChip) {
            setShowBack(true);
        }
    }, [location.state]);

    useEffect(() => {
        setAlbums(getParsedLocalStorage() || []);
        setGenreLabels(
            Object.fromEntries(getParsedGenres().map((g: { slug: string; label: string }) => [g.slug, g.label]))
        );
    }, []);

    const { selected, toggle, clear, commit, active } = useGenreFilter();

    // Every album, including ranks 1-13 (Hero/Still Fresh) — the Archive is
    // the full catalog, not just the overflow. `albums` is already
    // newest-first (sortAlbumsByReleaseDate runs before Main ever renders
    // Archive).
    const archivePool = useMemo(() => albums, [albums]);

    const buckets = useMemo(() => buildBuckets(archivePool, selected), [archivePool, selected]);

    const availableGenres = useMemo(
        () => computeAvailableGenres(archivePool, genreLabels, selected),
        [archivePool, genreLabels, selected]
    );

    const countForSelection = (slugs: GenreSlug[]) =>
        slugs.length === 0
            ? archivePool.length
            : archivePool.filter(a => albumGenres(a).some(g => slugs.includes(g))).length;

    const matchedTotal = countForSelection(selected);

    function viewAlbum(id: string) {
        localStorage.setItem('selectedID', id);
        navigate(`/album/${id}`);
    }

    const elements: React.ReactElement[] = [];
    buckets.forEach((yearBucket, yi) => {
        elements.push(
            <ArchiveEntry
                key={`year-${yearBucket.year}`}
                kind="year"
                label={yearBucket.year}
                position={yi === 0 ? 'start' : ''}
                matched={yearBucket.matched}
                total={yearBucket.total}
            />
        );

        yearBucket.months.forEach(m => {
            if (active && m.matched.length === 0) return;
            elements.push(
                <ArchiveEntry
                    key={`${yearBucket.year}-${m.month}`}
                    kind="month"
                    label={m.month}
                    albums={active ? m.matched : m.all}
                    onSelectAlbum={viewAlbum}
                />
            );
        });
    });

    elements.push(<ArchiveEntry key="end" kind="year" label="" position="end" />);

    return (
        <section className="archive">
            <section className="topBar">
                <button
                    className={`backArrow${showBack ? ' backArrow--visible' : ''}`}
                    aria-label="Back to album"
                    title="Back to album"
                    onClick={() => { setShowBack(false); navigate(-1); }}
                ><img src="/images/Arrow.svg" alt="" className="arrowImage" /></button>
                <h1 className="pageHeader pageHeader--section">THE ARCHIVE</h1>
            </section>
            <div className="divider"></div>

            <GenreFilterBar
                available={availableGenres}
                labels={genreLabels}
                selected={selected}
                toggle={toggle}
                clear={clear}
                commit={commit}
                active={active}
                resultCount={matchedTotal}
                resultNoun="debuts"
                countForSelection={countForSelection}
            />

            <section className="gridHolder">
                {elements}
            </section>
        </section>
    );
};

export default Archive;
