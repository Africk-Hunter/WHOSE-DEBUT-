import { ReleaseType } from './types';

export interface AlbumFormData {
    title: string;
    artist: string;
    releaseDate: string;
    genres: string[];
    releaseType: ReleaseType;
    description: string;
    fromafan: string;
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    previewSongName: string;
}

export const emptyAlbumForm: AlbumFormData = {
    title: '',
    artist: '',
    releaseDate: '',
    genres: [],
    releaseType: 'album',
    description: '',
    fromafan: '',
    spotify: '',
    apple: '',
    bandcamp: '',
    amazon: '',
    previewSongName: '',
};

export const MAX_GENRES = 3;
export const GENRE_LIMIT_MESSAGE = 'You can select up to 3 genres. Remove one first.';

// Returns null when the form is already at the genre limit.
export function addGenreToForm(form: AlbumFormData, slug: string): AlbumFormData | null {
    if (form.genres.includes(slug)) return form;
    if (form.genres.length >= MAX_GENRES) return null;
    return { ...form, genres: [...form.genres, slug] };
}

export function removeGenreFromForm(form: AlbumFormData, slug: string): AlbumFormData {
    return { ...form, genres: form.genres.filter(g => g !== slug) };
}

// Returns null when adding would exceed the genre limit.
export function toggleGenreOnForm(form: AlbumFormData, slug: string): AlbumFormData | null {
    return form.genres.includes(slug) ? removeGenreFromForm(form, slug) : addGenreToForm(form, slug);
}

function underscored(value: string): string {
    return value.replace(/\s+/g, '_');
}

export function coverFileName(form: Pick<AlbumFormData, 'artist' | 'title'>, ext: string | undefined): string {
    return `${underscored(form.artist)}-${underscored(form.title)}-${Date.now()}.${ext}`;
}

export function previewAudioFileName(form: Pick<AlbumFormData, 'artist' | 'title'>): string {
    return `${underscored(form.artist)}-${underscored(form.title)}-${Date.now()}-preview.wav`;
}
