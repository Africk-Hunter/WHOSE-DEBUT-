import { describe, expect, it } from 'vitest';
import { formatReviewText } from '../textFormatting';

describe('formatReviewText', () => {
    it('escapes HTML', () => {
        expect(formatReviewText('<script>alert(1)</script>')).toBe(
            '&lt;script&gt;alert(1)&lt;/script&gt;'
        );
        expect(formatReviewText('a & b')).toBe('a &amp; b');
    });
    it('allows whitelisted tags, case-insensitively', () => {
        expect(formatReviewText('<b>hi</b> <EM>there</EM>')).toBe('<b>hi</b> <em>there</em>');
    });
    it('allows <br> variants', () => {
        expect(formatReviewText('a<br>b<br/>c')).toBe('a<br />b<br />c');
    });
    it('does not allow attributes on whitelisted tags', () => {
        expect(formatReviewText('<b onclick="x()">hi</b>')).toBe(
            '&lt;b onclick="x()"&gt;hi</b>'
        );
    });
});
