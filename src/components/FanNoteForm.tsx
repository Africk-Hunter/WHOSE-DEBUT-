import React, { useEffect, useRef, useState } from 'react';
import emailjs from 'emailjs-com';
import { validateFanNote, FanNoteDraft, FanNoteErrors, BODY_MAX } from '../utilities/fanNotes';

interface FanNoteFormProps {
    albumId: string;
    albumName: string;
    artist: string;
}

const EMPTY_DRAFT: FanNoteDraft = { name: '', email: '', body: '', displayName: true };

// There's no moderation backend for fan notes (no Cloud Functions, no
// separate Firestore collection) — a submission is just emailed straight to
// Hunter via its own EmailJS template (VITE_EMAILJS_FAN_NOTE_TEMPLATE_ID),
// on the same service as the About page's contact form. He reads it and
// decides whether to fold it into the album's "From a Fan" field by hand.
const FanNoteForm: React.FC<FanNoteFormProps> = ({ albumId, albumName, artist }) => {
    const storageKey = `wd.fanNoteSent.${albumId}`;

    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<FanNoteDraft>(EMPTY_DRAFT);
    const [errors, setErrors] = useState<FanNoteErrors>({});
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        try {
            setSent(localStorage.getItem(storageKey) === '1');
        } catch {
            setSent(false);
        }
    }, [storageKey]);

    // The form is taller than the resting CTA, so on desktop (where the fan
    // note card sits pinned near the bottom of AlbumView's own scroll
    // container) opening it can push itself below the fold. Follow it down
    // so the newly opened form is actually visible without the user hunting
    // for it. Mobile lays the page out normally, so it's left alone.
    useEffect(() => {
        if (!open) return;
        if (!window.matchMedia('(min-width: 769px)').matches) return;
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDraft(prev => ({ ...prev, [name]: value }));
    };

    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDraft(prev => ({ ...prev, displayName: e.target.checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validation = validateFanNote(draft);
        setErrors(validation);
        if (Object.keys(validation).length > 0) return;

        setSending(true);
        try {
            await emailjs.send(
                import.meta.env.VITE_EMAILJS_SERVICE_ID,
                import.meta.env.VITE_EMAILJS_FAN_NOTE_TEMPLATE_ID,
                {
                    name: draft.name.trim(),
                    email: draft.email.trim(),
                    album_name: albumName,
                    artist: artist,
                    body: draft.body.trim(),
                    display_name: draft.displayName ? 'Yes' : 'No',
                },
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY
            );
            try {
                localStorage.setItem(storageKey, '1');
            } catch {
                // localStorage unavailable (private window, blocked storage) —
                // the email still sent, the receipt just won't survive reload.
            }
            setSent(true);
            setOpen(false);
            setDraft(EMPTY_DRAFT);
        } catch (error) {
            console.error('Failed to send fan note:', error);
            alert('Failed to send your note. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (sent) {
        return (
            <div className="fanNoteCta fanNoteCta--sent">
                <p className="fanNoteKicker">Thanks!</p>
                <p>Your note is on its way. Hunter reads every submission personally.</p>
            </div>
        );
    }

    return (
        <div className="fanNoteCta">
            {!open ? (
                <div className="fanNoteCtaResting">
                    <div className="fanNoteCtaText">
                        <p className="fanNoteKicker">Leave a note</p>
                        <p>Did the record resonate with you? Let us know!!</p>
                    </div>
                    <button type="button" className="fanNoteButton" onClick={() => setOpen(true)}>
                        Write a fan note
                    </button>
                </div>
            ) : (
                <form className="fanNoteForm" ref={formRef} onSubmit={handleSubmit} noValidate>
                    <div className="fanNoteFormHeader">
                        <h4>Your fan note</h4>
                        <button
                            type="button"
                            className="fanNoteClose"
                            aria-label="Close"
                            onClick={() => setOpen(false)}
                        >
                            &times;
                        </button>
                    </div>

                    <div className="fanNoteField">
                        <label htmlFor="fanNoteName">Your name</label>
                        <input
                            id="fanNoteName"
                            name="name"
                            value={draft.name}
                            onChange={handleChange}
                            aria-describedby={errors.name ? 'fanNoteNameError' : undefined}
                        />
                        {errors.name && <span id="fanNoteNameError" className="fanNoteError">{errors.name}</span>}
                    </div>

                    <div className="fanNoteFieldCheckbox">
                        <label htmlFor="fanNoteDisplayName">
                            <input
                                id="fanNoteDisplayName"
                                type="checkbox"
                                name="displayName"
                                checked={draft.displayName}
                                onChange={handleDisplayNameChange}
                            />
                            Display my name if this is featured
                        </label>
                    </div>

                    <div className="fanNoteField">
                        <label htmlFor="fanNoteEmail">Email address</label>
                        <input
                            id="fanNoteEmail"
                            type="email"
                            name="email"
                            value={draft.email}
                            onChange={handleChange}
                            aria-describedby="fanNoteEmailHelp"
                        />
                        <span id="fanNoteEmailHelp" className="fanNoteHelp">
                            Never published — only Hunter sees it.
                        </span>
                        {errors.email && <span className="fanNoteError">{errors.email}</span>}
                    </div>

                    <div className="fanNoteField">
                        <div className="fanNoteFieldLabelRow">
                            <label htmlFor="fanNoteBody">Your take</label>
                            <span className="fanNoteCounter">{draft.body.length} / {BODY_MAX}</span>
                        </div>
                        <textarea
                            id="fanNoteBody"
                            name="body"
                            value={draft.body}
                            onChange={handleChange}
                            maxLength={BODY_MAX}
                            aria-describedby={errors.body ? 'fanNoteBodyError' : undefined}
                        />
                        {errors.body && <span id="fanNoteBodyError" className="fanNoteError">{errors.body}</span>}
                    </div>

                    <button type="submit" className="fanNoteSubmit" disabled={sending}>
                        {sending ? 'Sending…' : 'Send for review'}
                    </button>
                </form>
            )}
        </div>
    );
};

export default FanNoteForm;
