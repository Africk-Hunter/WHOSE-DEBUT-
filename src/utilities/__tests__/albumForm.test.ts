import { describe, expect, it } from 'vitest';
import {
    addGenreToForm,
    coverFileName,
    emptyAlbumForm,
    previewAudioFileName,
    removeGenreFromForm,
    toggleGenreOnForm,
} from '../albumForm';

const withGenres = (genres: string[]) => ({ ...emptyAlbumForm, genres });

describe('genre helpers', () => {
    it('adds a genre and ignores duplicates', () => {
        const added = addGenreToForm(emptyAlbumForm, 'punk');
        expect(added?.genres).toEqual(['punk']);
        expect(addGenreToForm(added!, 'punk')).toBe(added);
    });
    it('returns null at the 3-genre limit', () => {
        expect(addGenreToForm(withGenres(['a', 'b', 'c']), 'd')).toBeNull();
        expect(toggleGenreOnForm(withGenres(['a', 'b', 'c']), 'd')).toBeNull();
    });
    it('toggle removes an already-selected genre, even at the limit', () => {
        expect(toggleGenreOnForm(withGenres(['a', 'b', 'c']), 'b')?.genres).toEqual(['a', 'c']);
        expect(removeGenreFromForm(withGenres(['a', 'b']), 'a').genres).toEqual(['b']);
    });
});

describe('file names', () => {
    const form = { artist: 'The Band', title: 'First Record' };
    it('underscores whitespace and ends with the extension', () => {
        expect(coverFileName(form, 'png')).toMatch(/^The_Band-First_Record-\d+\.png$/);
    });
    it('names preview clips as wav', () => {
        expect(previewAudioFileName(form)).toMatch(/^The_Band-First_Record-\d+-preview\.wav$/);
    });
});
