// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import {
    getParsedGenres,
    getParsedLocalStorage,
    pullAlbumInfoByID,
    setGenresInLocalStorage,
    sortAlbumsByReleaseDate,
} from '../localStorageHandling';

beforeEach(() => localStorage.clear());

describe('localStorageHandling', () => {
    it('returns [] when nothing is stored or JSON is corrupt', () => {
        expect(getParsedLocalStorage()).toEqual([]);
        localStorage.setItem('albums', '{bad');
        expect(getParsedLocalStorage()).toEqual([]);
        expect(getParsedGenres()).toEqual([]);
    });
    it('sorts albums newest first', () => {
        localStorage.setItem('albums', JSON.stringify([
            { id: 'a', year_released: '2020-01-01' },
            { id: 'b', year_released: '2024-06-01' },
            { id: 'c', year_released: '2022-03-01' },
        ]));
        sortAlbumsByReleaseDate();
        expect(getParsedLocalStorage().map((a: { id: string }) => a.id)).toEqual(['b', 'c', 'a']);
    });
    it('finds an album by id, or null', () => {
        localStorage.setItem('albums', JSON.stringify([{ id: 'x', name: 'X' }]));
        expect(pullAlbumInfoByID('x')?.name).toBe('X');
        expect(pullAlbumInfoByID('missing')).toBeNull();
    });
    it('round-trips genres', () => {
        setGenresInLocalStorage([{ slug: 'punk', label: 'PUNK' }]);
        expect(getParsedGenres()).toEqual([{ slug: 'punk', label: 'PUNK' }]);
    });
});
