import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseClient';
import { GenreEntry, slugify } from '../genres';
import { fetchAllGenres, getOrCreateGenre } from './genreInteractions';

interface ResolvedGenre {
    label: string;
    slug: string;
    status: 'existing' | 'new';
}

interface MigrationPreviewItem {
    albumId: string;
    albumName: string;
    alreadyCanonical: boolean;
    resolved: ResolvedGenre[];
}

interface MigrationReport {
    items: MigrationPreviewItem[];
    totalAlbums: number;
    toConvert: number;
    newGenres: GenreEntry[];
}

// Read-only: never writes to Firestore. Shows exactly what write mode would
// do, so a human can catch near-duplicate spellings (e.g. two different raw
// strings that would otherwise become two different "new" genres) before
// anything is created or rewritten.
async function previewGenreMigration(): Promise<MigrationReport> {
    const albumsSnap = await getDocs(collection(db, 'albums'));
    const existingGenres = await fetchAllGenres();
    const knownBySlug = new Map(existingGenres.map(g => [g.slug, g] as const));
    const knownByLabel = new Map(existingGenres.map(g => [g.label.trim().toLowerCase(), g] as const));
    const provisional = new Map<string, GenreEntry>();

    const items: MigrationPreviewItem[] = [];
    const newGenres: GenreEntry[] = [];

    albumsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const raw = data.genres;
        const albumName = data.name ?? docSnap.id;

        if (Array.isArray(raw)) {
            items.push({ albumId: docSnap.id, albumName, alreadyCanonical: true, resolved: [] });
            return;
        }

        const rawStr = typeof raw === 'string' ? raw : '';
        const pieces = rawStr.split(',').map(s => s.trim()).filter(Boolean);

        if (pieces.length === 0) {
            items.push({ albumId: docSnap.id, albumName, alreadyCanonical: true, resolved: [] });
            return;
        }

        const resolved: ResolvedGenre[] = pieces.map(label => {
            const slug = slugify(label);
            const existing = knownBySlug.get(slug) ?? knownByLabel.get(label.toLowerCase()) ?? provisional.get(slug);
            if (existing) {
                return { label: existing.label, slug: existing.slug, status: 'existing' as const };
            }
            const entry: GenreEntry = { slug, label };
            provisional.set(slug, entry);
            newGenres.push(entry);
            return { label, slug, status: 'new' as const };
        });

        items.push({ albumId: docSnap.id, albumName, alreadyCanonical: false, resolved });
    });

    const dedupedNewGenres = Array.from(new Map(newGenres.map(g => [g.slug, g])).values());

    return {
        items,
        totalAlbums: items.length,
        toConvert: items.filter(i => !i.alreadyCanonical).length,
        newGenres: dedupedNewGenres,
    };
}

// Idempotent: albums already holding an array under `genres` are skipped, so
// re-running after a successful migration converts zero further albums.
async function runGenreMigration(): Promise<{ converted: number }> {
    const albumsSnap = await getDocs(collection(db, 'albums'));
    let converted = 0;

    for (const docSnap of albumsSnap.docs) {
        const data = docSnap.data();
        const raw = data.genres;
        if (Array.isArray(raw)) continue;

        const rawStr = typeof raw === 'string' ? raw : '';
        const pieces = rawStr.split(',').map(s => s.trim()).filter(Boolean);
        if (pieces.length === 0) continue;

        const slugs: string[] = [];
        for (const label of pieces) {
            const entry = await getOrCreateGenre(label);
            slugs.push(entry.slug);
        }

        await updateDoc(doc(db, 'albums', docSnap.id), { genres: slugs });
        converted++;
    }

    return { converted };
}

export { previewGenreMigration, runGenreMigration };
export type { MigrationReport, MigrationPreviewItem, ResolvedGenre };
