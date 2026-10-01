import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseClient';
import { GenreEntry, slugify } from '../genres';

async function fetchAllGenres(): Promise<GenreEntry[]> {
    const snapshot = await getDocs(collection(db, 'genres'));
    return snapshot.docs.map(d => ({
        slug: d.id,
        label: (d.data().label as string) ?? d.id,
    }));
}

// Seeds the `genres` collection from a starter list, but only the first time
// it's empty — safe to call on every admin-dashboard mount. Returns the
// resulting genre list so callers don't need a second fetch to get it.
async function seedGenresIfEmpty(seed: GenreEntry[]): Promise<GenreEntry[]> {
    const existing = await fetchAllGenres();
    if (existing.length > 0) return existing;
    for (const entry of seed) {
        await setDoc(doc(db, 'genres', entry.slug), { label: entry.label });
    }
    return seed;
}

// Normalizes a typed label, reuses an existing genre if one already matches
// by slug or by label (case-insensitive), and only creates a new Firestore
// doc when neither match — this is the single place duplicate-prevention
// lives, used by the admin "+ Add genre" flow.
async function getOrCreateGenre(rawLabel: string): Promise<GenreEntry> {
    const label = rawLabel.trim();
    const slug = slugify(label);
    if (!slug) {
        throw new Error('Genre label cannot be empty');
    }

    const bySlug = await getDoc(doc(db, 'genres', slug));
    if (bySlug.exists()) {
        return { slug, label: (bySlug.data().label as string) ?? slug };
    }

    const all = await fetchAllGenres();
    const existing = all.find(g => g.label.trim().toLowerCase() === label.toLowerCase());
    if (existing) return existing;

    await setDoc(doc(db, 'genres', slug), { label });
    return { slug, label };
}

// Counts albums (hidden included) whose `genres` array still references this
// slug, so the admin can be warned before orphaning it.
async function countAlbumsUsingGenre(slug: string): Promise<number> {
    const snapshot = await getDocs(query(collection(db, 'albums'), where('genres', 'array-contains', slug)));
    return snapshot.size;
}

async function deleteGenre(slug: string): Promise<void> {
    await deleteDoc(doc(db, 'genres', slug));
}

export { fetchAllGenres, seedGenresIfEmpty, getOrCreateGenre, countAlbumsUsingGenre, deleteGenre };
