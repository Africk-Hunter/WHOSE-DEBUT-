export type GenreSlug = string;

export interface GenreEntry {
    slug: GenreSlug;
    label: string;
}

// Used once, to seed the Firestore `genres` collection the first time it's
// empty (see genreInteractions.seedGenresIfEmpty). Not read at runtime after
// that — the collection is the source of truth from then on.
export const SEED_GENRES: GenreEntry[] = [
    { slug: 'indie-rock', label: 'INDIE ROCK' },
    { slug: 'indie-folk', label: 'INDIE FOLK' },
    { slug: 'indie-pop', label: 'INDIE POP' },
    { slug: 'punk', label: 'PUNK' },
    { slug: 'hip-hop', label: 'HIP-HOP' },
    { slug: 'soul', label: 'SOUL' },
    { slug: 'funk', label: 'FUNK' },
    { slug: 'rnb', label: 'R&B' },
    { slug: 'electronic', label: 'ELECTRONIC' },
    { slug: 'ambient', label: 'AMBIENT' },
    { slug: 'shoegaze', label: 'SHOEGAZE' },
    { slug: 'desert-rock', label: 'DESERT ROCK' },
    { slug: 'americana', label: 'AMERICANA' },
    { slug: 'alt-country', label: 'ALT-COUNTRY' },
    { slug: 'country', label: 'COUNTRY' },
    { slug: 'bluegrass', label: 'BLUEGRASS' },
    { slug: 'folk', label: 'FOLK' },
    { slug: 'blues', label: 'BLUES' },
    { slug: 'jazz', label: 'JAZZ' },
    { slug: 'metal', label: 'METAL' },
    { slug: 'noise', label: 'NOISE' },
    { slug: 'experimental', label: 'EXPERIMENTAL' },
];

export function slugify(label: string): GenreSlug {
    return label
        .trim()
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Tolerates both the new shape (genres: string[] of slugs) and the legacy
// shape (genres: a raw, possibly comma-separated, free-text string) so a
// not-yet-migrated record never crashes a caller.
export function albumGenres(album: { genres?: unknown } | null | undefined): GenreSlug[] {
    const raw = album?.genres;
    if (Array.isArray(raw)) {
        return raw.filter((g): g is string => typeof g === 'string' && g.length > 0);
    }
    if (typeof raw === 'string' && raw.trim()) {
        return raw
            .split(',')
            .map(piece => slugify(piece))
            .filter(Boolean);
    }
    return [];
}

export interface GenreOption {
    slug: GenreSlug;
    label: string;
    count: number;
}

// Genres present in `pool`, with counts, sorted count-desc (currently
// selected genres hoisted to the front so a selection never scrolls out of
// sight). A genre with zero matches in this pool is never included — used by
// both the filter bar's "top 3" shortcut chips and the panel's full list, so
// the two orderings never drift apart.
export function computeAvailableGenres(
    pool: { genres?: unknown }[],
    labels: Record<GenreSlug, string>,
    selected: GenreSlug[] = []
): GenreOption[] {
    const counts = new Map<GenreSlug, number>();
    for (const album of pool) {
        for (const slug of albumGenres(album)) {
            counts.set(slug, (counts.get(slug) ?? 0) + 1);
        }
    }

    const options: GenreOption[] = Array.from(counts.entries())
        .filter(([, count]) => count > 0)
        .map(([slug, count]) => ({ slug, label: labels[slug] ?? slug, count }));

    return options.sort((a, b) => {
        const aSelected = selected.includes(a.slug) ? 0 : 1;
        const bSelected = selected.includes(b.slug) ? 0 : 1;
        if (aSelected !== bSelected) return aSelected - bSelected;
        if (b.count !== a.count) return b.count - a.count;
        return a.label.localeCompare(b.label);
    });
}
