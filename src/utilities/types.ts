export interface FanComment {
    id: string;
    name: string;
    text: string;
}

export interface Album {
    id: string;
    name: string;
    artist: string;
    image_url: string;
    year_released: string;
    artist_review: string;
    from_a_peer: string;
    genres: string[];
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    rank?: number;
    preview_audio_url?: string;
    preview_song_name?: string;
    comments?: FanComment[];
    hidden?: boolean;
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
