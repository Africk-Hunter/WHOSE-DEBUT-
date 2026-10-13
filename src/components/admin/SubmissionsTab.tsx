import React, { useEffect, useState } from 'react';
import {
    fetchAllSubmissions,
    updateSubmission,
    setSubmissionStatus,
    deleteSubmission,
    publishSubmissionAsAlbum,
} from '../../utilities/database/submissionInteractions';
import { GenreEntry, albumGenres } from '../../utilities/genres';
import { Submission, SubmissionStatus } from '../../utilities/types';
import { optimizeCloudinaryUrl } from '../../utilities/cloudinary';
import { trimAndUploadPreview, uploadCoverForForm } from '../../utilities/albumUploads';
import { useAlbumForm } from '../../hooks/useAlbumForm';
import { logError } from '../../utilities/logger';
import AlbumFormFields from './AlbumFormFields';

type SubmissionFilter = SubmissionStatus | 'all';

const SUBMISSION_FILTERS: SubmissionFilter[] = ['pending', 'published', 'rejected', 'all'];

interface SubmissionsTabProps {
    active: boolean;
    availableGenres: GenreEntry[];
    onGenreCreated: (genre: GenreEntry) => void;
    onAlbumPublished: () => void;
    onPendingCountChange: (count: number) => void;
}

const SubmissionsTab: React.FC<SubmissionsTabProps> = ({
    active,
    availableGenres,
    onGenreCreated,
    onAlbumPublished,
    onPendingCountChange,
}) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
    const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>('pending');
    const [reviewing, setReviewing] = useState<Submission | null>(null);
    const [reviewAudioLoading, setReviewAudioLoading] = useState(false);
    const [publishHidden, setPublishHidden] = useState(true);
    const [isSavingReview, setIsSavingReview] = useState(false);
    const form = useAlbumForm(onGenreCreated);
    const { formData, imageFile, audioFile, audioStartSeconds, isProcessingAudio } = form;

    const loadSubmissionsList = async () => {
        setSubmissionsLoading(true);
        try {
            setSubmissions(await fetchAllSubmissions());
            setSubmissionsLoaded(true);
        } catch (error) {
            logError('Error loading submissions:', error);
            alert('Failed to load submissions: ' + error);
        }
        setSubmissionsLoading(false);
    };

    useEffect(() => {
        if (!active || submissionsLoaded) return;
        loadSubmissionsList();
    }, [active, submissionsLoaded]);

    const pendingCount = submissions.filter(s => (s.status ?? 'pending') === 'pending').length;
    useEffect(() => {
        onPendingCountChange(pendingCount);
    }, [pendingCount, onPendingCountChange]);

    const visibleSubmissions =
        submissionFilter === 'all' ? submissions : submissions.filter(s => (s.status ?? 'pending') === submissionFilter);

    // The submitter's audio is uploaded untrimmed, so pull it back down into
    // the clip selector — the 30s window is chosen here, at publish time.
    const loadSubmissionAudio = async (submission: Submission) => {
        if (!submission.preview_audio_url) return;
        setReviewAudioLoading(true);
        try {
            const res = await fetch(submission.preview_audio_url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            form.setAudioFile(new File([blob], 'submission-audio', { type: blob.type || 'audio/mpeg' }));
        } catch (error) {
            logError('Error loading submission audio:', error);
            alert('Could not load the submitted audio. You can upload a file manually instead.');
        }
        setReviewAudioLoading(false);
    };

    const startReview = (submission: Submission) => {
        setReviewing(submission);
        form.setFormData({
            title: submission.name ?? '',
            artist: submission.artist ?? '',
            releaseDate: submission.year_released ?? '',
            genres: albumGenres(submission),
            releaseType: submission.release_type ?? 'album',
            description: submission.artist_review ?? '',
            fromafan: '',
            spotify: submission.spotify ?? '',
            apple: submission.apple ?? '',
            bandcamp: submission.bandcamp ?? '',
            amazon: submission.amazon ?? '',
            previewSongName: submission.preview_song_name ?? '',
        });
        form.resetMedia();
        form.setNewGenreLabel('');
        setPublishHidden(true);
        if (submission.status !== 'published') loadSubmissionAudio(submission);
    };

    const closeReview = () => {
        setReviewing(null);
        form.resetMedia();
    };

    const patchSubmission = (id: string, updates: Partial<Submission>) => {
        setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    };

    // '' = no new cover chosen, null = upload failed (already alerted).
    const uploadReviewCover = async (): Promise<string | null> => {
        if (!imageFile) return '';
        const url = await uploadCoverForForm(imageFile, formData);
        return url || null;
    };

    const handleSaveReview = async () => {
        if (!reviewing) return;
        setIsSavingReview(true);
        const newImageUrl = await uploadReviewCover();
        if (newImageUrl === null) {
            setIsSavingReview(false);
            return;
        }
        const updates: Partial<Submission> = {
            name: formData.title,
            artist: formData.artist,
            year_released: formData.releaseDate,
            genres: formData.genres,
            release_type: formData.releaseType,
            artist_review: formData.description,
            spotify: formData.spotify,
            apple: formData.apple,
            bandcamp: formData.bandcamp,
            amazon: formData.amazon,
            preview_song_name: formData.previewSongName,
            ...(newImageUrl ? { image_url: newImageUrl } : {}),
        };
        const success = await updateSubmission(reviewing.id, updates);
        setIsSavingReview(false);
        if (success) {
            patchSubmission(reviewing.id, updates);
            setReviewing(prev => (prev ? { ...prev, ...updates } : prev));
            form.setImageFile(null);
            alert('Submission saved');
        }
    };

    const handlePublishSubmission = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reviewing) return;
        if (reviewing.status === 'published') {
            alert('This submission has already been published.');
            return;
        }
        if (formData.genres.length === 0) {
            alert('Select at least one genre.');
            return;
        }
        if (reviewing.preview_audio_url && !audioFile) {
            const proceed = window.confirm('The submitted audio is not loaded, so the album will publish without a preview. Continue?');
            if (!proceed) return;
        }

        setIsSavingReview(true);
        const newImageUrl = await uploadReviewCover();
        if (newImageUrl === null) {
            setIsSavingReview(false);
            return;
        }
        const imageUrl = newImageUrl || reviewing.image_url;

        let previewAudioUrl = '';
        if (audioFile) {
            form.setIsProcessingAudio(true);
            const uploaded = await trimAndUploadPreview(audioFile, audioStartSeconds, form.decodedAudioBufferRef.current, formData);
            form.setIsProcessingAudio(false);
            if (uploaded === null) {
                setIsSavingReview(false);
                return;
            }
            previewAudioUrl = uploaded;
        }

        const albumId = await publishSubmissionAsAlbum(
            reviewing.id,
            formData,
            imageUrl,
            previewAudioUrl || undefined,
            publishHidden
        );
        setIsSavingReview(false);

        if (albumId) {
            patchSubmission(reviewing.id, { status: 'published', published_album_id: albumId });
            onAlbumPublished();
            alert(publishHidden ? 'Published as a hidden album. Unhide it from Manage Albums when ready.' : 'Album published!');
            closeReview();
        }
    };

    const handleSetSubmissionStatus = async (submission: Submission, status: SubmissionStatus) => {
        if (await setSubmissionStatus(submission.id, status)) {
            patchSubmission(submission.id, { status });
            if (reviewing?.id === submission.id) closeReview();
        }
    };

    const handleDeleteSubmission = async (submission: Submission) => {
        const confirmed = window.confirm(`Delete the submission "${submission.name}" by ${submission.artist}? This cannot be undone.`);
        if (!confirmed) return;
        if (await deleteSubmission(submission.id)) {
            if (reviewing?.id === submission.id) closeReview();
            setSubmissions(prev => prev.filter(s => s.id !== submission.id));
        }
    };

    return (
        <section className="adminPanel">
            {reviewing ? (
                <>
                    <h2>Review Submission</h2>
                    <div className="submissionMeta">
                        <p>
                            <strong>Contact:</strong>{' '}
                            <a href={`mailto:${reviewing.contact_email}`}>{reviewing.contact_email}</a>
                        </p>
                        {reviewing.submitted_at && (
                            <p><strong>Submitted:</strong> {new Date(reviewing.submitted_at).toLocaleString()}</p>
                        )}
                        {reviewing.suggested_genres && (
                            <p><strong>Suggested genres:</strong> {reviewing.suggested_genres}</p>
                        )}
                        {reviewing.unreleased && (
                            <p><strong>Unreleased:</strong> the artist has no streaming links yet.</p>
                        )}
                        {reviewing.other_links && (
                            <p className="submissionMetaLinks"><strong>Other links:</strong> {reviewing.other_links}</p>
                        )}
                        {reviewing.status === 'published' && (
                            <p><strong>Already published</strong> (album id {reviewing.published_album_id}).</p>
                        )}
                    </div>
                    <form onSubmit={handlePublishSubmission} className="albumForm">
                        <AlbumFormFields
                            {...form.fieldProps}
                            availableGenres={availableGenres}
                            onFileChange={e => form.setImageFile(e.target.files?.[0] ?? null)}
                            existingImageUrl={reviewing.image_url}
                            existingAudioUrl={reviewing.preview_audio_url}
                        />
                        {reviewAudioLoading && <p className="formHint">Loading submitted audio&hellip;</p>}
                        <label className="adminCheckbox">
                            <input
                                type="checkbox"
                                checked={publishHidden}
                                onChange={e => setPublishHidden(e.target.checked)}
                            />
                            Hide album when published (unhide later from Manage Albums)
                        </label>
                        <div className="submitRow">
                            <button type="button" className="adminButton" onClick={closeReview}>
                                Back
                            </button>
                            <button type="button" className="adminButton" onClick={handleSaveReview} disabled={isSavingReview}>
                                Save Edits
                            </button>
                            <button
                                type="submit"
                                className="adminButton adminButton--primary"
                                disabled={isSavingReview || isProcessingAudio || reviewAudioLoading || reviewing.status === 'published'}
                            >
                                {isSavingReview ? 'Working…' : publishHidden ? 'Publish (Hidden)' : 'Publish'}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <>
                    <div className="albumListHeader">
                        <h2>Submissions</h2>
                        <button type="button" className="adminButton" onClick={loadSubmissionsList} disabled={submissionsLoading}>
                            Refresh
                        </button>
                    </div>
                    <div className="submissionFilters">
                        {SUBMISSION_FILTERS.map(f => (
                            <button
                                type="button"
                                key={f}
                                className={`genreChip ${submissionFilter === f ? 'genreChip--active' : ''}`}
                                aria-pressed={submissionFilter === f}
                                onClick={() => setSubmissionFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    {submissionsLoading && <p className="formHint">Loading submissions&hellip;</p>}
                    {!submissionsLoading && visibleSubmissions.length === 0 && (
                        <p className="formHint">No submissions here.</p>
                    )}
                    <ul className="albumList">
                        {visibleSubmissions.map(submission => {
                            const status = submission.status ?? 'pending';
                            return (
                                <li key={submission.id} className="albumListItem">
                                    {submission.image_url && (
                                        <img src={optimizeCloudinaryUrl(submission.image_url, 120)} alt="" className="albumListThumb" />
                                    )}
                                    <div className="albumListInfo">
                                        <p className="albumListTitle">
                                            {submission.name}
                                            {status !== 'pending' && <span className="hiddenBadge">{status}</span>}
                                        </p>
                                        <p className="albumListMeta">
                                            {submission.artist} &middot; {submission.year_released}
                                            {submission.submitted_at && <> &middot; sent {new Date(submission.submitted_at).toLocaleDateString()}</>}
                                        </p>
                                    </div>
                                    <div className="albumListActions">
                                        <button type="button" className="adminButton" onClick={() => startReview(submission)}>
                                            {status === 'published' ? 'View' : 'Review'}
                                        </button>
                                        {status === 'pending' && (
                                            <button type="button" className="adminButton" onClick={() => handleSetSubmissionStatus(submission, 'rejected')}>
                                                Reject
                                            </button>
                                        )}
                                        {status === 'rejected' && (
                                            <button type="button" className="adminButton" onClick={() => handleSetSubmissionStatus(submission, 'pending')}>
                                                Reopen
                                            </button>
                                        )}
                                        <button type="button" className="adminButton adminButton--danger" onClick={() => handleDeleteSubmission(submission)}>
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </section>
    );
};

export default SubmissionsTab;
