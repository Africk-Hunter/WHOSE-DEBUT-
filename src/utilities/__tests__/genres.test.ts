import { describe, expect, it } from 'vitest';
import { albumGenres, computeAvailableGenres, slugify } from '../genres';

describe('slugify', () => {
    it('lowercases, trims and hyphenates', () => {
        expect(slugify('  Indie Rock ')).toBe('indie-rock');
    });
    it('replaces & with "and" and strips edge punctuation', () => {
        expect(slugify('R&B')).toBe('randb');
        expect(slugify('--Hip-Hop!--')).toBe('hip-hop');
    });
});

describe('albumGenres', () => {
    it('returns slug arrays as-is, dropping non-strings and empties', () => {
        expect(albumGenres({ genres: ['punk', '', 3, 'soul'] })).toEqual(['punk', 'soul']);
    });
    it('converts legacy comma-separated strings to slugs', () => {
        expect(albumGenres({ genres: 'Indie Rock, Hip-Hop ,,' })).toEqual(['indie-rock', 'hip-hop']);
    });
    it('returns [] for missing or blank values', () => {
        expect(albumGenres(null)).toEqual([]);
        expect(albumGenres({})).toEqual([]);
        expect(albumGenres({ genres: '   ' })).toEqual([]);
    });
});

describe('computeAvailableGenres', () => {
    const pool = [
        { genres: ['punk', 'soul'] },
        { genres: ['punk'] },
        { genres: ['jazz'] },
        { genres: 'soul' },
    ];
    const labels = { punk: 'PUNK', soul: 'SOUL' };

    it('counts and sorts by count desc, then label', () => {
        expect(computeAvailableGenres(pool, labels)).toEqual([
            { slug: 'punk', label: 'PUNK', count: 2 },
            { slug: 'soul', label: 'SOUL', count: 2 },
            { slug: 'jazz', label: 'jazz', count: 1 },
        ]);
    });
    it('hoists selected genres to the front', () => {
        const result = computeAvailableGenres(pool, labels, ['jazz']);
        expect(result[0].slug).toBe('jazz');
    });
});
