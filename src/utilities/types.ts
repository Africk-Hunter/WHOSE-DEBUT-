export interface FanComment {
    id: string;
    name: string;
    text: string;
}

export type ReleaseType = 'single' | 'ep' | 'album';

export const RELEASE_TYPES: ReleaseType[] = ['album', 'ep', 'single'];

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
    album: 'Album',
    ep: 'EP',
    single: 'Single',
};

export interface Album {
    id: string;
    name: string;
    artist: string;
    image_url: string;
    year_released: string;
    artist_review: string;
    from_a_peer: string;
    genres: string[];
    release_type?: ReleaseType;
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    rank?: number;
    preview_audio_url?: string;
    preview_song_name?: string;
    comments?: FanComment[];
    hidden?: boolean;
    isPlaceholder?: boolean;
}

export type SubmissionStatus = 'pending' | 'published' | 'rejected';

export interface Submission {
    id: string;
    status: SubmissionStatus;
    submitted_at?: number;
    contact_email: string;
    name: string;
    artist: string;
    year_released: string;
    genres: string[];
    suggested_genres: string;
    release_type?: ReleaseType;
    artist_review: string;
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    other_links: string;
    unreleased?: boolean;
    image_url: string;
    preview_audio_url?: string;
    preview_song_name?: string;
    published_album_id?: string;
}
