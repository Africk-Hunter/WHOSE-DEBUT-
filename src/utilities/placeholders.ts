import type { Album } from './types';
import type { PlaceholderSettings } from './database/placeholderSettings';

// Generates in-memory-only filler cards from the admin-configured template —
// never written to Firestore or localStorage, so they can't leak into the
// Archive or be opened as a real album.
export function buildPlaceholderAlbums(settings: PlaceholderSettings): Album[] {
    if (!settings.enabled || settings.count <= 0) return [];
    return Array.from({ length: settings.count }, (_, i) => ({
        id: `placeholder-${i}`,
        name: settings.title,
        artist: settings.artist,
        image_url: settings.image_url,
        year_released: '',
        artist_review: '',
        from_a_peer: '',
        genres: [],
        spotify: '',
        apple: '',
        bandcamp: '',
        amazon: '',
        isPlaceholder: true,
    }));
}
