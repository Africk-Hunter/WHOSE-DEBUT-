import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAllGenres } from '../utilities/database/genreInteractions';
import { uploadCoverToCloudinary, uploadPreviewAudioToCloudinary } from '../utilities/database/firebaseInteractions';
import { createSubmission } from '../utilities/database/submissionInteractions';
import { GenreEntry } from '../utilities/genres';
import {
    SubmissionDraft,
    SubmissionErrors,
    validateSubmission,
    MAX_SUBMISSION_GENRES,
    PITCH_MAX,
} from '../utilities/submissions';
import { logError } from '../utilities/logger';

const emptyDraft: SubmissionDraft = {
    title: '',
    artist: '',
    releaseDate: '',
    email: '',
    genres: [],
    suggestedGenres: '',
    pitch: '',
    spotify: '',
    apple: '',
    bandcamp: '',
    amazon: '',
    otherLinks: '',
    unreleased: false,
    previewSongName: '',
};

const safeName = (s: string) => s.trim().replace(/[^\w-]+/g, '_').slice(0, 60);

const Submission: React.FC = () => {
    const navigate = useNavigate();
    const [draft, setDraft] = useState<SubmissionDraft>(emptyDraft);
    const [cover, setCover] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [audio, setAudio] = useState<File | null>(null);
    const [genres, setGenres] = useState<GenreEntry[]>([]);
    const [errors, setErrors] = useState<SubmissionErrors>({});
    const [honeypot, setHoneypot] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    useEffect(() => {
        fetchAllGenres()
            .then(list => setGenres([...list].sort((a, b) => a.label.localeCompare(b.label))))
            .catch(error => logError('Error loading genres:', error));
    }, []);

    useEffect(() => {
        if (!cover) {
            setCoverPreview(null);
            return;
        }
        const url = URL.createObjectURL(cover);
        setCoverPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [cover]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDraft(prev => ({ ...prev, [name]: value }));
    };

    const toggleGenre = (slug: string) => {
        setDraft(prev => {
            if (prev.genres.includes(slug)) return { ...prev, genres: prev.genres.filter(g => g !== slug) };
            if (prev.genres.length >= MAX_SUBMISSION_GENRES) return prev;
            return { ...prev, genres: [...prev.genres, slug] };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'sending') return;

        // Bots fill every field; real visitors never see this one.
        if (honeypot) {
            setStatus('sent');
            return;
        }

        const found = validateSubmission(draft, cover, audio);
        setErrors(found);
        if (Object.keys(found).length > 0 || !cover) {
            document.querySelector('.submissionError')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setStatus('sending');
        try {
            const base = `submission-${safeName(draft.artist)}-${safeName(draft.title)}-${Date.now()}`;
            const imageUrl = await uploadCoverToCloudinary(base, cover);
            if (!imageUrl) throw new Error('Cover upload failed');

            let previewAudioUrl = '';
            if (audio) {
                previewAudioUrl = await uploadPreviewAudioToCloudinary(`${base}-audio`, audio);
                if (!previewAudioUrl) throw new Error('Audio upload failed');
            }

            await createSubmission({
                contact_email: draft.email.trim(),
                name: draft.title.trim(),
                artist: draft.artist.trim(),
                year_released: draft.releaseDate,
                genres: draft.genres,
                suggested_genres: draft.suggestedGenres.trim(),
                artist_review: draft.pitch.trim(),
                spotify: draft.unreleased ? '' : draft.spotify.trim(),
                apple: draft.unreleased ? '' : draft.apple.trim(),
                bandcamp: draft.unreleased ? '' : draft.bandcamp.trim(),
                amazon: draft.unreleased ? '' : draft.amazon.trim(),
                other_links: draft.unreleased ? '' : draft.otherLinks.trim(),
                unreleased: draft.unreleased,
                image_url: imageUrl,
                ...(previewAudioUrl
                    ? { preview_audio_url: previewAudioUrl, preview_song_name: draft.previewSongName.trim() }
                    : {}),
            });
            setStatus('sent');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            logError('Error sending submission:', error);
            alert('Something went wrong sending your submission. Please try again.');
            setStatus('idle');
        }
    };

    const fieldError = (key: keyof SubmissionErrors) =>
        errors[key] ? <p className="submissionError">{errors[key]}</p> : null;

    return (
        <div className="about submissionPage">
            <section className="topBar">
                <button className="backArrow backArrow--visible" onClick={() => navigate('/')}>
                    <img src="/images/Arrow.svg" alt="Back" className="arrowImage" />
                </button>
                <h1 className="pageHeader pageHeader--about">SUBMIT</h1>
            </section>
            <div className="divider"></div>

            <main className="submissionContent">
                {status === 'sent' ? (
                    <div className="submissionThanks">
                        <p className="submissionThanksTitle">Got it, thank you!</p>
                        <p>
                            Your release is in the queue. I&rsquo;ll check it out and reach out to the email you gave
                            if I have any questions. Thanks!
                        </p>
                        <p className="hunter">- Hunter</p>
                        <button type="button" className="messageSubmitButton submissionHomeButton" onClick={() => navigate('/')}>
                            Back to the main site
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="submissionIntro">
                            Releasing something? Tell me about it. Every submission is reviewed before it shows up on
                            the site. And no, it doesn&rsquo;t have to be a debut!
                        </p>

                        <form className="submissionForm" onSubmit={handleSubmit} noValidate>
                            <input
                                type="text"
                                name="website"
                                className="submissionHoneypot"
                                tabIndex={-1}
                                autoComplete="off"
                                aria-hidden="true"
                                value={honeypot}
                                onChange={e => setHoneypot(e.target.value)}
                            />

                            <div className="submissionRow">
                                <label className="submissionField">
                                    <span className="submissionLabel">Name of your release *</span>
                                    <input className="formInput" name="title" value={draft.title} onChange={handleChange} />
                                    {fieldError('title')}
                                </label>
                                <label className="submissionField">
                                    <span className="submissionLabel">Artist name *</span>
                                    <input className="formInput" name="artist" value={draft.artist} onChange={handleChange} />
                                    {fieldError('artist')}
                                </label>
                            </div>

                            <div className="submissionRow">
                                <label className="submissionField">
                                    <span className="submissionLabel">Release date *</span>
                                    <input
                                        className="formInput"
                                        type="date"
                                        name="releaseDate"
                                        value={draft.releaseDate}
                                        onChange={handleChange}
                                    />
                                    {fieldError('releaseDate')}
                                </label>
                                <label className="submissionField">
                                    <span className="submissionLabel">Your email *</span>
                                    <input
                                        className="formInput"
                                        type="email"
                                        name="email"
                                        value={draft.email}
                                        onChange={handleChange}
                                        placeholder="So I can reach you. Never shown publicly."
                                    />
                                    {fieldError('email')}
                                </label>
                            </div>

                            <div className="submissionField">
                                <span className="submissionLabel">Album cover *</span>
                                <label className="submissionFile">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={e => setCover(e.target.files?.[0] ?? null)}
                                    />
                                    <span>{cover ? cover.name : 'Choose an image (max 10 MB)'}</span>
                                </label>
                                {coverPreview && <img src={coverPreview} alt="Cover preview" className="submissionCover" />}
                                {fieldError('cover')}
                            </div>

                            <div className="submissionField">
                                <span className="submissionLabel">
                                    Genres * <span className="submissionHint">(pick up to {MAX_SUBMISSION_GENRES})</span>
                                </span>
                                <div className="submissionChips">
                                    {genres.map(g => {
                                        const active = draft.genres.includes(g.slug);
                                        return (
                                            <button
                                                type="button"
                                                key={g.slug}
                                                className={`submissionChip${active ? ' submissionChip--active' : ''}`}
                                                aria-pressed={active}
                                                disabled={!active && draft.genres.length >= MAX_SUBMISSION_GENRES}
                                                onClick={() => toggleGenre(g.slug)}
                                            >
                                                {g.label}
                                            </button>
                                        );
                                    })}
                                </div>
                                <input
                                    className="formInput"
                                    name="suggestedGenres"
                                    value={draft.suggestedGenres}
                                    onChange={handleChange}
                                    placeholder="Don't see yours? Type it here"
                                />
                                {fieldError('genres')}
                            </div>

                            <label className="submissionField">
                                <span className="submissionLabel">Artist pitch *</span>
                                <span className="submissionHint">
                                    Say whatever you want to describe your release. This is what fans will read.
                                </span>
                                <textarea
                                    className="formInput submissionTextarea"
                                    name="pitch"
                                    value={draft.pitch}
                                    onChange={handleChange}
                                    maxLength={PITCH_MAX}
                                />
                                <span className="submissionHint submissionCount">
                                    {draft.pitch.length}/{PITCH_MAX}
                                </span>
                                {fieldError('pitch')}
                            </label>

                            <div className="submissionField">
                                <span className="submissionLabel">
                                    Streaming links{draft.unreleased ? '' : ' *'}{' '}
                                    <span className="submissionHint">(at least one)</span>
                                </span>
                                <label className="submissionCheckbox">
                                    <input
                                        type="checkbox"
                                        checked={!!draft.unreleased}
                                        onChange={e => setDraft(prev => ({ ...prev, unreleased: e.target.checked }))}
                                    />
                                    <span>Unreleased (no links yet)</span>
                                </label>
                                <div className="submissionRow">
                                    <input className="formInput" name="spotify" type="url" value={draft.spotify} onChange={handleChange} placeholder="Spotify" disabled={draft.unreleased} />
                                    <input className="formInput" name="apple" type="url" value={draft.apple} onChange={handleChange} placeholder="Apple Music" disabled={draft.unreleased} />
                                </div>
                                <div className="submissionRow">
                                    <input className="formInput" name="bandcamp" type="url" value={draft.bandcamp} onChange={handleChange} placeholder="Bandcamp" disabled={draft.unreleased} />
                                    <input className="formInput" name="amazon" type="url" value={draft.amazon} onChange={handleChange} placeholder="Amazon Music" disabled={draft.unreleased} />
                                </div>
                                <input
                                    className="formInput"
                                    name="otherLinks"
                                    value={draft.otherLinks}
                                    onChange={handleChange}
                                    placeholder="Anywhere else? (YouTube, SoundCloud, Instagram…)"
                                    disabled={draft.unreleased}
                                />
                                {fieldError('links')}
                            </div>

                            <div className="submissionField">
                                <span className="submissionLabel">
                                    A song preview <span className="submissionHint">(optional)</span>
                                </span>
                                <label className="submissionFile">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={e => setAudio(e.target.files?.[0] ?? null)}
                                    />
                                    <span>{audio ? audio.name : 'Choose an audio file (max 50 MB)'}</span>
                                </label>
                                {audio && (
                                    <input
                                        className="formInput"
                                        name="previewSongName"
                                        value={draft.previewSongName}
                                        onChange={handleChange}
                                        placeholder="Song name"
                                    />
                                )}
                                {fieldError('audio')}
                            </div>

                            <div className="buttonWrapper">
                                <button className="messageSubmitButton" type="submit" disabled={status === 'sending'}>
                                    {status === 'sending' ? 'Sending…' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </>
                )}
                <a href="/" className="backToMain">Take me back to the main site</a>
            </main>
        </div>
    );
};

export default Submission;
