import { describe, expect, it } from 'vitest';
import { sortAlbumsNewestFirst } from '../albumSorting';
import { Album } from '../types';

const album = (id: string, year_released: string) => ({ id, year_released }) as Album;

describe('sortAlbumsNewestFirst', () => {
    it('sorts newest first without mutating the input', () => {
        const input = [album('a', '2020-01-01'), album('b', '2024-01-01'), album('c', '2022-01-01')];
        expect(sortAlbumsNewestFirst(input).map(a => a.id)).toEqual(['b', 'c', 'a']);
        expect(input.map(a => a.id)).toEqual(['a', 'b', 'c']);
    });
});
