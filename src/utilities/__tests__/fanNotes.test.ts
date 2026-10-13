import { describe, expect, it } from 'vitest';
import { BODY_MAX, BODY_MIN, validateFanNote } from '../fanNotes';

const valid = {
    name: 'Sam',
    email: 'sam@example.com',
    body: 'x'.repeat(BODY_MIN),
    displayName: true,
};

describe('validateFanNote', () => {
    it('accepts a valid draft', () => {
        expect(validateFanNote(valid)).toEqual({});
    });
    it('rejects short and long names (after trimming)', () => {
        expect(validateFanNote({ ...valid, name: ' a ' }).name).toBeDefined();
        expect(validateFanNote({ ...valid, name: 'n'.repeat(41) }).name).toBeDefined();
    });
    it('rejects malformed emails', () => {
        expect(validateFanNote({ ...valid, email: 'nope' }).email).toBeDefined();
        expect(validateFanNote({ ...valid, email: 'a@b' }).email).toBeDefined();
    });
    it('enforces body length bounds', () => {
        expect(validateFanNote({ ...valid, body: 'x'.repeat(BODY_MIN - 1) }).body).toBeDefined();
        expect(validateFanNote({ ...valid, body: 'x'.repeat(BODY_MAX + 1) }).body).toBeDefined();
        expect(validateFanNote({ ...valid, body: 'x'.repeat(BODY_MAX) }).body).toBeUndefined();
    });
});
