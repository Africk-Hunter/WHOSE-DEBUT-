export interface FanNoteDraft {
    name: string;
    email: string;
    body: string;
    displayName: boolean;
}

export interface FanNoteErrors {
    name?: string;
    email?: string;
    body?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BODY_MIN = 20;
const BODY_MAX = 500;

function validateFanNote(draft: FanNoteDraft): FanNoteErrors {
    const errors: FanNoteErrors = {};
    const name = draft.name.trim();
    const email = draft.email.trim();
    const body = draft.body.trim();

    if (name.length < 2 || name.length > 40) {
        errors.name = 'Enter your name (2-40 characters).';
    }
    if (!EMAIL_RE.test(email)) {
        errors.email = 'Enter a valid email address.';
    }
    if (body.length < BODY_MIN) {
        errors.body = `Say a bit more (at least ${BODY_MIN} characters).`;
    } else if (body.length > BODY_MAX) {
        errors.body = `Keep it under ${BODY_MAX} characters.`;
    }

    return errors;
}

export { validateFanNote, EMAIL_RE, BODY_MIN, BODY_MAX };
