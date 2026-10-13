import { describe, expect, it } from 'vitest';
import { optimizeCloudinaryUrl } from '../cloudinary';

describe('optimizeCloudinaryUrl', () => {
    it('injects transform params after /upload/', () => {
        expect(optimizeCloudinaryUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg', 400)).toBe(
            'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_400,c_limit/v1/a.jpg'
        );
    });
    it('leaves non-Cloudinary and empty URLs untouched', () => {
        expect(optimizeCloudinaryUrl('https://example.com/upload/a.jpg', 400)).toBe('https://example.com/upload/a.jpg');
        expect(optimizeCloudinaryUrl('', 400)).toBe('');
    });
});
