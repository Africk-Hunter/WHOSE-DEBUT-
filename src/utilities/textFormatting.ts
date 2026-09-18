const ALLOWED_TAGS = ['b', 'i', 'u', 'strong', 'em'];

// Escapes the whole string first, then selectively un-escapes a small
// whitelist of formatting tags so admin-entered markup can't smuggle in
// scripts or arbitrary attributes via dangerouslySetInnerHTML.
export function formatReviewText(text: string): string {
    let escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    ALLOWED_TAGS.forEach(tag => {
        escaped = escaped
            .replace(new RegExp(`&lt;${tag}&gt;`, 'gi'), `<${tag}>`)
            .replace(new RegExp(`&lt;/${tag}&gt;`, 'gi'), `</${tag}>`);
    });

    escaped = escaped.replace(/&lt;br\s*\/?&gt;/gi, '<br />');

    return escaped;
}
