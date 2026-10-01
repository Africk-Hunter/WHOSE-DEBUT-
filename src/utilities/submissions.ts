import { EMAIL_RE } from './fanNotes';

export interface SubmissionDraft {
    title: string;
    artist: string;
    releaseDate: string;
    email: string;
    genres: string[];
    suggestedGenres: string;
    pitch: string;
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    otherLinks: string;
    unreleased: boolean;
    previewSongName: string;
}

export type SubmissionErrors = Partial<Record<keyof SubmissionDraft | 'cover' | 'links' | 'audio', string>>;

export const MAX_SUBMISSION_GENRES = 3;
export const PITCH_MAX = 2000;
export const COVER_MAX_BYTES = 10 * 1024 * 1024;
export const AUDIO_MAX_BYTES = 50 * 1024 * 1024;

const URL_RE = /^https?:\/\/\S+$/i;

function validateSubmission(draft: SubmissionDraft, cover: File | null, audio: File | null): SubmissionErrors {
    const errors: SubmissionErrors = {};

    if (!draft.title.trim()) errors.title = 'Enter the name of your release.';
    if (!draft.artist.trim()) errors.artist = 'Enter your artist name.';
    if (!draft.releaseDate) errors.releaseDate = 'Enter the release date.';
    if (!EMAIL_RE.test(draft.email.trim())) errors.email = 'Enter a valid email address.';

    if (draft.genres.length === 0 && !draft.suggestedGenres.trim()) {
        errors.genres = 'Pick at least one genre (or type your own).';
    }

    const pitch = draft.pitch.trim();
    if (!pitch) errors.pitch = 'Tell us a little about your release.';
    else if (pitch.length > PITCH_MAX) errors.pitch = `Keep it under ${PITCH_MAX} characters.`;

    const linkFields = [draft.spotify, draft.apple, draft.bandcamp, draft.amazon].map(l => l.trim());
    if (draft.unreleased) {
        // No links required; the inputs are disabled and cleared on submit.
    } else if (linkFields.some(l => l && !URL_RE.test(l))) {
        errors.links = 'Links must start with http:// or https://.';
    } else if (linkFields.every(l => !l) && !draft.otherLinks.trim()) {
        errors.links = 'Add at least one link to your release.';
    }

    if (!cover) errors.cover = 'Upload your album cover.';
    else if (!cover.type.startsWith('image/')) errors.cover = 'The cover must be an image file.';
    else if (cover.size > COVER_MAX_BYTES) errors.cover = 'The cover must be under 10 MB.';

    if (audio) {
        if (!audio.type.startsWith('audio/')) errors.audio = 'The preview must be an audio file.';
        else if (audio.size > AUDIO_MAX_BYTES) errors.audio = 'The audio file must be under 50 MB.';
    }

    return errors;
}

export { validateSubmission };
