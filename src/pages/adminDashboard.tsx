import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/database/firebaseAuth';
import {
    uploadCoverToCloudinary,
    uploadPreviewAudioToCloudinary,
    submitAlbumToFirebase,
    fetchAllAlbumsFromFirebase,
    updateAlbumInFirebase,
    deleteAlbumFromFirebase,
    updateAlbumComments,
    updateAlbumHidden,
    seedTestAlbums,
    buildAlbumUpdatePayload,
} from '../utilities/database/firebaseInteractions';
import { trimAudioToWav, AudioProcessingError } from '../utilities/audio/trimAudioToWav';
import { seedGenresIfEmpty, getOrCreateGenre, countAlbumsUsingGenre, deleteGenre } from '../utilities/database/genreInteractions';
import { fetchPlaceholderSettings, savePlaceholderSettings, PlaceholderSettings, DEFAULT_PLACEHOLDER_SETTINGS } from '../utilities/database/placeholderSettings';
import { GenreEntry, SEED_GENRES, albumGenres } from '../utilities/genres';
import {
    fetchAllSubmissions,
    updateSubmission,
    setSubmissionStatus,
    deleteSubmission,
    publishSubmissionAsAlbum,
} from '../utilities/database/submissionInteractions';
import { Album, FanComment, Submission, SubmissionStatus } from '../utilities/types';
import { optimizeCloudinaryUrl } from '../utilities/cloudinary';
import LoadingScreen from '../components/LoadingScreen';
import AudioClipSelector from '../components/AudioClipSelector';
import { logError } from '../utilities/logger';

interface AlbumFormData {
    title: string;
    artist: string;
    releaseDate: string;
    genres: string[];
    description: string;
    fromafan: string;
    spotify: string;
    apple: string;
    bandcamp: string;
    amazon: string;
    previewSongName: string;
}

const emptyAlbumForm: AlbumFormData = {
    title: '',
    artist: '',
    releaseDate: '',
    genres: [],
    description: '',
    fromafan: '',
    spotify: '',
    apple: '',
    bandcamp: '',
    amazon: '',
    previewSongName: '',
};

type Tab = 'add' | 'manage' | 'submissions' | 'comments' | 'placeholders';
type SubmissionFilter = SubmissionStatus | 'all';

interface AlbumFormFieldsProps {
    formData: AlbumFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    availableGenres: GenreEntry[];
    newGenreLabel: string;
    onNewGenreLabelChange: (value: string) => void;
    onAddGenre: () => void;
    onToggleGenre: (slug: string) => void;
    onDeleteGenre?: (genre: GenreEntry) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    imagePreviewUrl: string | null;
    existingImageUrl?: string;
    onAudioFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    audioFile: File | null;
    audioStartSeconds: number;
    onAudioStartSecondsChange: (seconds: number) => void;
    onAudioError: (message: string) => void;
    onAudioDecoded: (buffer: AudioBuffer) => void;
    existingAudioUrl?: string;
    isProcessingAudio: boolean;
}

const AlbumFormFields: React.FC<AlbumFormFieldsProps> = ({
    formData,
    onInputChange,
    availableGenres,
    newGenreLabel,
    onNewGenreLabelChange,
    onAddGenre,
    onToggleGenre,
    onDeleteGenre,
    onFileChange,
    imagePreviewUrl,
    existingImageUrl,
    onAudioFileChange,
    audioFile,
    audioStartSeconds,
    onAudioStartSecondsChange,
    onAudioError,
    onAudioDecoded,
    existingAudioUrl,
    isProcessingAudio,
}) => (
    <>
        <div className="formSection">
            <p className="formSectionTitle">Basic Info</p>
            <div className="formRow">
                <div className="formGroup">
                    <label htmlFor="title">Album Title</label>
                    <input type="text" id="title" name="title" value={formData.title} onChange={onInputChange} required />
                </div>
                <div className="formGroup">
                    <label htmlFor="artist">Artist Name</label>
                    <input type="text" id="artist" name="artist" value={formData.artist} onChange={onInputChange} required />
                </div>
            </div>
            <div className="formRow">
                <div className="formGroup">
                    <label htmlFor="releaseDate">Release Date</label>
                    <input type="date" id="releaseDate" name="releaseDate" value={formData.releaseDate} onChange={onInputChange} required />
                </div>
            </div>
            <div className="formGroup genrePicker">
                <label>Genres (choose up to 3)</label>
                <div className="genreChipGrid">
                    {availableGenres.map(g => (
                        <span key={g.slug} className="genreChipWrap">
                            <button
                                type="button"
                                className={`genreChip ${formData.genres.includes(g.slug) ? 'genreChip--active' : ''}`}
                                aria-pressed={formData.genres.includes(g.slug)}
                                onClick={() => onToggleGenre(g.slug)}
                            >
                                {g.label}
                            </button>
                            {onDeleteGenre && (
                                <button
                                    type="button"
                                    className="genreChipDelete"
                                    aria-label={`Delete genre ${g.label}`}
                                    title={`Delete "${g.label}"`}
                                    onClick={() => onDeleteGenre(g)}
                                >
                                    &times;
                                </button>
                            )}
                        </span>
                    ))}
                </div>
                <div className="genreAddRow">
                    <input
                        type="text"
                        placeholder="Add a new genre"
                        value={newGenreLabel}
                        onChange={e => onNewGenreLabelChange(e.target.value)}
                    />
                    <button type="button" className="adminButton" onClick={onAddGenre}>
                        Add
                    </button>
                </div>
                <p className="formHint">{formData.genres.length}/3 selected</p>
            </div>
            <div className="formGroup">
                <label htmlFor="imageFile">Album Cover Image</label>
                <input type="file" id="imageFile" name="imageFile" accept="image/*" onChange={onFileChange} />
                {(imagePreviewUrl || existingImageUrl) && (
                    <img
                        src={imagePreviewUrl || optimizeCloudinaryUrl(existingImageUrl ?? '', 320)}
                        alt="Cover preview"
                        className="coverPreview"
                    />
                )}
            </div>
            <div className="formGroup">
                <label htmlFor="audioFile">Album Preview Audio (optional)</label>
                <input type="file" id="audioFile" name="audioFile" accept="audio/*" onChange={onAudioFileChange} />
                <p className="formHint">
                    Drag the highlighted region to choose which 30 seconds will be used as the preview.
                </p>
                {audioFile ? (
                    <AudioClipSelector
                        file={audioFile}
                        clipSeconds={30}
                        startSeconds={audioStartSeconds}
                        onStartSecondsChange={onAudioStartSecondsChange}
                        onError={onAudioError}
                        onDecoded={onAudioDecoded}
                    />
                ) : existingAudioUrl ? (
                    <audio src={existingAudioUrl} controls className="audioPreview" />
                ) : null}
                {isProcessingAudio && <p className="formHint">Processing audio preview&hellip;</p>}
                {(audioFile || existingAudioUrl) && (
                    <div className="formGroup">
                        <label htmlFor="previewSongName">Song Name (for snippet)</label>
                        <input
                            type="text"
                            id="previewSongName"
                            name="previewSongName"
                            value={formData.previewSongName}
                            onChange={onInputChange}
                            placeholder="Which song is this preview from?"
                        />
                    </div>
                )}
            </div>
        </div>

        <div className="formSection">
            <p className="formSectionTitle">Reviews</p>
            <p className="formHint">
                You can use &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;strong&gt;, &lt;em&gt; and &lt;br&gt; tags for formatting.
            </p>
            <div className="formGroup">
                <label htmlFor="description">Artist Review</label>
                <textarea id="description" name="description" value={formData.description} onChange={onInputChange} rows={4} />
            </div>
        </div>

        <div className="formSection">
            <p className="formSectionTitle">Streaming Links</p>
            <div className="formRow">
                <div className="formGroup">
                    <label htmlFor="spotify">Spotify</label>
                    <input type="url" id="spotify" name="spotify" value={formData.spotify} onChange={onInputChange} />
                </div>
                <div className="formGroup">
                    <label htmlFor="apple">Apple Music</label>
                    <input type="url" id="apple" name="apple" value={formData.apple} onChange={onInputChange} />
                </div>
            </div>
            <div className="formRow">
                <div className="formGroup">
                    <label htmlFor="bandcamp">Bandcamp</label>
                    <input type="url" id="bandcamp" name="bandcamp" value={formData.bandcamp} onChange={onInputChange} />
                </div>
                <div className="formGroup">
                    <label htmlFor="amazon">Amazon Music</label>
                    <input type="url" id="amazon" name="amazon" value={formData.amazon} onChange={onInputChange} />
                </div>
            </div>
        </div>
    </>
);

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('add');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/admin');
                return;
            }
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, [navigate]);

    // --- Add Album form state ---
    const [albumData, setAlbumData] = useState<AlbumFormData>(emptyAlbumForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioStartSeconds, setAudioStartSeconds] = useState(0);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [newGenreLabel, setNewGenreLabel] = useState('');
    const decodedAudioBufferRef = useRef<AudioBuffer | null>(null);

    // --- Manage Albums tab state ---
    const [albums, setAlbums] = useState<Album[]>([]);
    const [albumsLoading, setAlbumsLoading] = useState(false);
    const [albumsLoaded, setAlbumsLoaded] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [editFormData, setEditFormData] = useState<AlbumFormData>(emptyAlbumForm);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [editImagePreviewUrl, setEditImagePreviewUrl] = useState<string | null>(null);
    const [editAudioFile, setEditAudioFile] = useState<File | null>(null);
    const [editAudioStartSeconds, setEditAudioStartSeconds] = useState(0);
    const [editIsProcessingAudio, setEditIsProcessingAudio] = useState(false);
    const [editNewGenreLabel, setEditNewGenreLabel] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const editDecodedAudioBufferRef = useRef<AudioBuffer | null>(null);

    const [availableGenres, setAvailableGenres] = useState<GenreEntry[]>([]);

    // --- Comments tab state ---
    const [commentsAlbumId, setCommentsAlbumId] = useState('');
    const [commentsSearch, setCommentsSearch] = useState('');
    const [newCommentName, setNewCommentName] = useState('');
    const [newCommentText, setNewCommentText] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);

    // --- Submissions tab state ---
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [submissionsLoading, setSubmissionsLoading] = useState(false);
    const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
    const [submissionFilter, setSubmissionFilter] = useState<SubmissionFilter>('pending');
    const [reviewing, setReviewing] = useState<Submission | null>(null);
    const [reviewFormData, setReviewFormData] = useState<AlbumFormData>(emptyAlbumForm);
    const [reviewImageFile, setReviewImageFile] = useState<File | null>(null);
    const [reviewImagePreviewUrl, setReviewImagePreviewUrl] = useState<string | null>(null);
    const [reviewAudioFile, setReviewAudioFile] = useState<File | null>(null);
    const [reviewAudioLoading, setReviewAudioLoading] = useState(false);
    const [reviewAudioStartSeconds, setReviewAudioStartSeconds] = useState(0);
    const [reviewIsProcessingAudio, setReviewIsProcessingAudio] = useState(false);
    const [reviewNewGenreLabel, setReviewNewGenreLabel] = useState('');
    const [publishHidden, setPublishHidden] = useState(true);
    const [isSavingReview, setIsSavingReview] = useState(false);
    const reviewDecodedAudioBufferRef = useRef<AudioBuffer | null>(null);

    // --- Placeholders tab state ---
    const [placeholderSettings, setPlaceholderSettings] = useState<PlaceholderSettings>(DEFAULT_PLACEHOLDER_SETTINGS);
    const [placeholderSettingsLoaded, setPlaceholderSettingsLoaded] = useState(false);
    const [placeholderImageFile, setPlaceholderImageFile] = useState<File | null>(null);
    const [placeholderImagePreviewUrl, setPlaceholderImagePreviewUrl] = useState<string | null>(null);
    const [isSavingPlaceholders, setIsSavingPlaceholders] = useState(false);

    useEffect(() => {
        if (!authChecked) return;
        const initGenres = async () => {
            setAvailableGenres(await seedGenresIfEmpty(SEED_GENRES));
        };
        initGenres();
    }, [authChecked]);

    const sortAlbumsByReleaseDate = (list: Album[]) =>
        [...list].sort((a, b) => new Date(b.year_released).getTime() - new Date(a.year_released).getTime());

    const loadAlbumsList = async () => {
        setAlbumsLoading(true);
        const fetched = await fetchAllAlbumsFromFirebase();
        setAlbums(sortAlbumsByReleaseDate(fetched));
        setAlbumsLoading(false);
        setAlbumsLoaded(true);
    };

    useEffect(() => {
        if (!authChecked || albumsLoaded || (activeTab !== 'manage' && activeTab !== 'comments')) return;
        loadAlbumsList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authChecked, activeTab, albumsLoaded]);

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
        if (!authChecked || submissionsLoaded || activeTab !== 'submissions') return;
        loadSubmissionsList();
    },[authChecked, activeTab, submissionsLoaded]);

    useEffect(() => {
        if (!reviewImageFile) {
            setReviewImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(reviewImageFile);
        setReviewImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [reviewImageFile]);

    useEffect(() => {
        if (!authChecked || placeholderSettingsLoaded || activeTab !== 'placeholders') return;
        const loadPlaceholderSettings = async () => {
            setPlaceholderSettings(await fetchPlaceholderSettings());
            setPlaceholderSettingsLoaded(true);
        };
        loadPlaceholderSettings();
    }, [authChecked, activeTab, placeholderSettingsLoaded]);

    useEffect(() => {
        if (!imageFile) {
            setImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    useEffect(() => {
        if (!editImageFile) {
            setEditImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(editImageFile);
        setEditImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [editImageFile]);

    useEffect(() => {
        if (!placeholderImageFile) {
            setPlaceholderImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(placeholderImageFile);
        setPlaceholderImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [placeholderImageFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAlbumData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setAudioFile(e.target.files[0]);
            setAudioStartSeconds(0);
            decodedAudioBufferRef.current = null;
        }
    };

    const toggleGenre = (slug: string) => {
        setAlbumData(prev => {
            if (prev.genres.includes(slug)) {
                return { ...prev, genres: prev.genres.filter(g => g !== slug) };
            }
            if (prev.genres.length >= 3) {
                alert('You can select up to 3 genres. Remove one first.');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, slug] };
        });
    };

    const handleAddGenre = async () => {
        const label = newGenreLabel.trim();
        if (!label) return;
        const entry = await getOrCreateGenre(label);
        setAvailableGenres(prev => (prev.some(g => g.slug === entry.slug) ? prev : [...prev, entry]));
        setNewGenreLabel('');
        setAlbumData(prev => {
            if (prev.genres.includes(entry.slug)) return prev;
            if (prev.genres.length >= 3) {
                alert('You can select up to 3 genres. Remove one first.');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, entry.slug] };
        });
    };

    // --- Edit form handlers ---
    const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEditImageFile(e.target.files[0]);
        }
    };

    const handleEditAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setEditAudioFile(e.target.files[0]);
            setEditAudioStartSeconds(0);
            editDecodedAudioBufferRef.current = null;
        }
    };

    const handleDeleteGenre = async (genre: GenreEntry) => {
        try {
            const usage = await countAlbumsUsingGenre(genre.slug);
            const warning = usage > 0
                ? `"${genre.label}" is still used by ${usage} album(s). They'll keep the slug but it won't display as a known genre. Delete anyway?`
                : `Delete genre "${genre.label}"?`;
            if (!window.confirm(warning)) return;
            await deleteGenre(genre.slug);
            setAvailableGenres(prev => prev.filter(g => g.slug !== genre.slug));
            setAlbumData(prev => ({ ...prev, genres: prev.genres.filter(g => g !== genre.slug) }));
        } catch (error) {
            console.error('Error deleting genre:', error);
            alert('Failed to delete genre.');
        }
    };

    const toggleEditGenre = (slug: string) => {
        setEditFormData(prev => {
            if (prev.genres.includes(slug)) {
                return { ...prev, genres: prev.genres.filter(g => g !== slug) };
            }
            if (prev.genres.length >= 3) {
                alert('You can select up to 3 genres. Remove one first.');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, slug] };
        });
    };

    const handleEditAddGenre = async () => {
        const label = editNewGenreLabel.trim();
        if (!label) return;
        const entry = await getOrCreateGenre(label);
        setAvailableGenres(prev => (prev.some(g => g.slug === entry.slug) ? prev : [...prev, entry]));
        setEditNewGenreLabel('');
        setEditFormData(prev => {
            if (prev.genres.includes(entry.slug)) return prev;
            if (prev.genres.length >= 3) {
                alert('You can select up to 3 genres. Remove one first.');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, entry.slug] };
        });
    };

    const startEditingAlbum = (album: Album) => {
        setEditingAlbum(album);
        setEditFormData({
            title: album.name ?? '',
            artist: album.artist ?? '',
            releaseDate: album.year_released ?? '',
            genres: albumGenres(album),
            description: album.artist_review ?? '',
            fromafan: album.from_a_peer ?? '',
            spotify: album.spotify ?? '',
            apple: album.apple ?? '',
            bandcamp: album.bandcamp ?? '',
            amazon: album.amazon ?? '',
            previewSongName: album.preview_song_name ?? '',
        });
        setEditImageFile(null);
        setEditAudioFile(null);
        setEditAudioStartSeconds(0);
        setEditNewGenreLabel('');
    };

    const cancelEditingAlbum = () => {
        setEditingAlbum(null);
        setEditImageFile(null);
        setEditAudioFile(null);
        setEditAudioStartSeconds(0);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAlbum) return;

        if (editFormData.genres.length === 0) {
            alert('Select at least one genre.');
            return;
        }

        let imageUrl = '';
        if (editImageFile) {
            const fileExt = editImageFile.name.split('.').pop();
            const fileName = `${editFormData.artist.replace(/\s+/g, '_')}-${editFormData.title.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
            imageUrl = await uploadCoverToCloudinary(fileName, editImageFile);
        }

        let previewAudioUrl = '';
        if (editAudioFile) {
            setEditIsProcessingAudio(true);
            try {
                const trimmedWav = await trimAudioToWav(
                    editAudioFile,
                    30,
                    editAudioStartSeconds,
                    editDecodedAudioBufferRef.current ?? undefined
                );
                const audioFileName = `${editFormData.artist.replace(/\s+/g, '_')}-${editFormData.title.replace(/\s+/g, '_')}-${Date.now()}-preview.wav`;
                previewAudioUrl = await uploadPreviewAudioToCloudinary(audioFileName, trimmedWav);
            } catch (error) {
                if (error instanceof AudioProcessingError) {
                    alert(error.message);
                } else {
                    logError('Error processing preview audio:', error);
                    alert('Failed to process preview audio.');
                }
                setEditIsProcessingAudio(false);
                return;
            }
            setEditIsProcessingAudio(false);
        }

        setIsSavingEdit(true);
        const success = await updateAlbumInFirebase(editingAlbum.id, editFormData, imageUrl || undefined, previewAudioUrl || undefined);
        setIsSavingEdit(false);

        if (success) {
            alert('Album updated successfully');
            const updates = buildAlbumUpdatePayload(editFormData, imageUrl || undefined, previewAudioUrl || undefined);
            setAlbums(prev =>
                sortAlbumsByReleaseDate(prev.map(a => (a.id === editingAlbum.id ? { ...a, ...updates } : a)))
            );
            cancelEditingAlbum();
        }
    };

    const handleToggleHidden = async (album: Album) => {
        const success = await updateAlbumHidden(album.id, !album.hidden);
        if (success) {
            setAlbums(prev => prev.map(a => (a.id === album.id ? { ...a, hidden: !album.hidden } : a)));
        }
    };

    const handleDeleteAlbum = async (album: Album) => {
        const confirmed = window.confirm(`Delete "${album.name}" by ${album.artist}? This cannot be undone.`);
        if (!confirmed) return;
        const success = await deleteAlbumFromFirebase(album.id);
        if (success) {
            if (editingAlbum?.id === album.id) cancelEditingAlbum();
            setAlbums(prev => prev.filter(a => a.id !== album.id));
        }
    };

    // --- Comments tab handlers ---
    const commentsAlbum = albums.find(a => a.id === commentsAlbumId) ?? null;
    const commentsQuery = commentsSearch.trim().toLowerCase();
    const filteredCommentsAlbums = commentsQuery
        ? albums.filter(a => a.name.toLowerCase().includes(commentsQuery) || a.artist.toLowerCase().includes(commentsQuery))
        : albums;

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentsAlbum) return;

        const name = newCommentName.trim();
        const text = newCommentText.trim();
        if (!name || !text) {
            alert('Enter both a name and a comment.');
            return;
        }

        const newComment: FanComment = { id: crypto.randomUUID(), name, text };
        const updatedComments = [...(commentsAlbum.comments ?? []), newComment];

        setIsSavingComment(true);
        const success = await updateAlbumComments(commentsAlbum.id, updatedComments);
        setIsSavingComment(false);

        if (success) {
            setNewCommentName('');
            setNewCommentText('');
            setAlbums(prev => prev.map(a => (a.id === commentsAlbum.id ? { ...a, comments: updatedComments } : a)));
        }
    };

    const handleRemoveComment = async (commentId: string) => {
        if (!commentsAlbum) return;
        const confirmed = window.confirm('Remove this comment?');
        if (!confirmed) return;

        const updatedComments = (commentsAlbum.comments ?? []).filter(c => c.id !== commentId);
        const success = await updateAlbumComments(commentsAlbum.id, updatedComments);
        if (success) {
            setAlbums(prev => prev.map(a => (a.id === commentsAlbum.id ? { ...a, comments: updatedComments } : a)));
        }
    };

    // --- Submissions tab handlers ---
    const addGenreToForm = (prev: AlbumFormData, slug: string): AlbumFormData => {
        if (prev.genres.includes(slug)) return prev;
        if (prev.genres.length >= 3) {
            alert('You can select up to 3 genres. Remove one first.');
            return prev;
        }
        return { ...prev, genres: [...prev.genres, slug] };
    };

    const toggleReviewGenre = (slug: string) => {
        setReviewFormData(prev =>
            prev.genres.includes(slug) ? { ...prev, genres: prev.genres.filter(g => g !== slug) } : addGenreToForm(prev, slug)
        );
    };

    const handleReviewAddGenre = async () => {
        const label = reviewNewGenreLabel.trim();
        if (!label) return;
        const entry = await getOrCreateGenre(label);
        setAvailableGenres(prev => (prev.some(g => g.slug === entry.slug) ? prev : [...prev, entry]));
        setReviewNewGenreLabel('');
        setReviewFormData(prev => addGenreToForm(prev, entry.slug));
    };

    const handleReviewInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReviewFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleReviewAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReviewAudioFile(e.target.files[0]);
            setReviewAudioStartSeconds(0);
            reviewDecodedAudioBufferRef.current = null;
        }
    };

    // The submitter's audio is uploaded untrimmed, so pull it back down into
    // the clip selector — the 30s window is chosen here, at publish time.
    const loadSubmissionAudio = async (submission: Submission) => {
        if (!submission.preview_audio_url) return;
        setReviewAudioLoading(true);
        try {
            const res = await fetch(submission.preview_audio_url);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            setReviewAudioFile(new File([blob], 'submission-audio', { type: blob.type || 'audio/mpeg' }));
        } catch (error) {
            logError('Error loading submission audio:', error);
            alert('Could not load the submitted audio. You can upload a file manually instead.');
        }
        setReviewAudioLoading(false);
    };

    const startReview = (submission: Submission) => {
        setReviewing(submission);
        setReviewFormData({
            title: submission.name ?? '',
            artist: submission.artist ?? '',
            releaseDate: submission.year_released ?? '',
            genres: albumGenres(submission),
            description: submission.artist_review ?? '',
            fromafan: '',
            spotify: submission.spotify ?? '',
            apple: submission.apple ?? '',
            bandcamp: submission.bandcamp ?? '',
            amazon: submission.amazon ?? '',
            previewSongName: submission.preview_song_name ?? '',
        });
        setReviewImageFile(null);
        setReviewAudioFile(null);
        setReviewAudioStartSeconds(0);
        reviewDecodedAudioBufferRef.current = null;
        setReviewNewGenreLabel('');
        setPublishHidden(true);
        if (submission.status !== 'published') loadSubmissionAudio(submission);
    };

    const closeReview = () => {
        setReviewing(null);
        setReviewImageFile(null);
        setReviewAudioFile(null);
        setReviewAudioStartSeconds(0);
    };

    const patchSubmission = (id: string, updates: Partial<Submission>) => {
        setSubmissions(prev => prev.map(s => (s.id === id ? { ...s, ...updates } : s)));
    };

    // '' = no new cover chosen, null = upload failed (already alerted).
    const uploadReviewCover = async (): Promise<string | null> => {
        if (!reviewImageFile) return '';
        const fileExt = reviewImageFile.name.split('.').pop();
        const fileName = `${reviewFormData.artist.replace(/\s+/g, '_')}-${reviewFormData.title.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
        const url = await uploadCoverToCloudinary(fileName, reviewImageFile);
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
            name: reviewFormData.title,
            artist: reviewFormData.artist,
            year_released: reviewFormData.releaseDate,
            genres: reviewFormData.genres,
            artist_review: reviewFormData.description,
            spotify: reviewFormData.spotify,
            apple: reviewFormData.apple,
            bandcamp: reviewFormData.bandcamp,
            amazon: reviewFormData.amazon,
            preview_song_name: reviewFormData.previewSongName,
            ...(newImageUrl ? { image_url: newImageUrl } : {}),
        };
        const success = await updateSubmission(reviewing.id, updates);
        setIsSavingReview(false);
        if (success) {
            patchSubmission(reviewing.id, updates);
            setReviewing(prev => (prev ? { ...prev, ...updates } : prev));
            setReviewImageFile(null);
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
        if (reviewFormData.genres.length === 0) {
            alert('Select at least one genre.');
            return;
        }
        if (reviewing.preview_audio_url && !reviewAudioFile) {
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
        if (reviewAudioFile) {
            setReviewIsProcessingAudio(true);
            try {
                const trimmedWav = await trimAudioToWav(
                    reviewAudioFile,
                    30,
                    reviewAudioStartSeconds,
                    reviewDecodedAudioBufferRef.current ?? undefined
                );
                const audioFileName = `${reviewFormData.artist.replace(/\s+/g, '_')}-${reviewFormData.title.replace(/\s+/g, '_')}-${Date.now()}-preview.wav`;
                previewAudioUrl = await uploadPreviewAudioToCloudinary(audioFileName, trimmedWav);
            } catch (error) {
                if (error instanceof AudioProcessingError) {
                    alert(error.message);
                } else {
                    logError('Error processing preview audio:', error);
                    alert('Failed to process preview audio.');
                }
                setReviewIsProcessingAudio(false);
                setIsSavingReview(false);
                return;
            }
            setReviewIsProcessingAudio(false);
        }

        const albumId = await publishSubmissionAsAlbum(
            reviewing.id,
            reviewFormData,
            imageUrl,
            previewAudioUrl || undefined,
            publishHidden
        );
        setIsSavingReview(false);

        if (albumId) {
            patchSubmission(reviewing.id, { status: 'published', published_album_id: albumId });
            // Manage/Comments tabs cache the album list — invalidate it so the
            // new album shows up next time either tab is opened.
            setAlbumsLoaded(false);
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

    const visibleSubmissions =
        submissionFilter === 'all' ? submissions : submissions.filter(s => (s.status ?? 'pending') === submissionFilter);
    const pendingCount = submissions.filter(s => (s.status ?? 'pending') === 'pending').length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (albumData.genres.length === 0) {
            alert('Select at least one genre.');
            return;
        }

        let imageUrl = '';

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${albumData.artist.replace(/\s+/g, '_')}-${albumData.title.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
            imageUrl = await uploadCoverToCloudinary(fileName, imageFile);
        }

        let previewAudioUrl = '';

        if (audioFile) {
            setIsProcessingAudio(true);
            try {
                const trimmedWav = await trimAudioToWav(
                    audioFile,
                    30,
                    audioStartSeconds,
                    decodedAudioBufferRef.current ?? undefined
                );
                const audioFileName = `${albumData.artist.replace(/\s+/g, '_')}-${albumData.title.replace(/\s+/g, '_')}-${Date.now()}-preview.wav`;
                previewAudioUrl = await uploadPreviewAudioToCloudinary(audioFileName, trimmedWav);
            } catch (error) {
                if (error instanceof AudioProcessingError) {
                    alert(error.message);
                } else {
                    logError('Error processing preview audio:', error);
                    alert('Failed to process preview audio.');
                }
                setIsProcessingAudio(false);
                return;
            }
            setIsProcessingAudio(false);
        }

        if (await submitAlbumToFirebase(albumData, imageUrl, previewAudioUrl || undefined)) {
            setAlbumData(emptyAlbumForm);
            setImageFile(null);
            setAudioFile(null);
            setAudioStartSeconds(0);
            // Manage/Comments tabs cache the album list — invalidate it so the
            // new album shows up next time either tab is opened.
            setAlbumsLoaded(false);
        }
    };

    // --- Placeholders tab handlers ---
    const handlePlaceholderFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPlaceholderImageFile(e.target.files[0]);
        }
    };

    const handleSavePlaceholderSettings = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageUrl = placeholderSettings.image_url;
        if (placeholderImageFile) {
            const fileExt = placeholderImageFile.name.split('.').pop();
            const fileName = `placeholder-cover-${Date.now()}.${fileExt}`;
            imageUrl = await uploadCoverToCloudinary(fileName, placeholderImageFile);
        }

        const updated: PlaceholderSettings = { ...placeholderSettings, image_url: imageUrl };
        setIsSavingPlaceholders(true);
        const success = await savePlaceholderSettings(updated);
        setIsSavingPlaceholders(false);

        if (success) {
            setPlaceholderSettings(updated);
            setPlaceholderImageFile(null);
            alert('Placeholder settings saved');
        }
    };

    async function handleSeedAlbums() {
        if (!window.confirm('This will add 15 test albums to the live database. Continue?')) return;
        await seedTestAlbums();
        alert('15 test albums added successfully');
    }

    async function handleLogout() {
        await signOut(auth);
        navigate('/');
    }

    if (!authChecked) return <LoadingScreen />;

    const tabs: { id: Tab; label: string }[] = [
        { id: 'add', label: 'Add Album' },
        { id: 'manage', label: 'Manage Albums' },
        { id: 'submissions', label: pendingCount > 0 ? `Submissions (${pendingCount})` : 'Submissions' },
        { id: 'comments', label: 'Fan Notes' },
        { id: 'placeholders', label: 'Placeholders' },
    ];

    return (
        <div className="about adminPage">
            <section className="topBar">
                <button className="backArrow backArrow--visible" onClick={() => navigate('/')}>
                    <img src="/images/Arrow.svg" alt="Back to main site" className="arrowImage" />
                </button>
                <h1 className="pageHeader pageHeader--about">ADMIN</h1>
            </section>
            <div className="divider"></div>

            <main className="adminContent">
                <div className="adminToolbar">
                    <nav className="adminTabs" aria-label="Admin sections">
                        {tabs.map(tab => (
                            <button
                                type="button"
                                key={tab.id}
                                className={`adminTab ${activeTab === tab.id ? 'adminTab--active' : ''}`}
                                aria-pressed={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="adminActions">
                        <button type="button" onClick={handleSeedAlbums} className="adminButton adminButton--ghost">
                            Seed Test Albums
                        </button>
                        <button type="button" onClick={handleLogout} className="adminButton">
                            Logout
                        </button>
                    </div>
                </div>

                {activeTab === 'add' && (
                    <section className="adminPanel">
                        <h2>Add New Album</h2>
                        <form onSubmit={handleSubmit} className="albumForm">
                            <AlbumFormFields
                                formData={albumData}
                                onInputChange={handleInputChange}
                                availableGenres={availableGenres}
                                newGenreLabel={newGenreLabel}
                                onNewGenreLabelChange={setNewGenreLabel}
                                onAddGenre={handleAddGenre}
                                onToggleGenre={toggleGenre}
                                onDeleteGenre={handleDeleteGenre}
                                onFileChange={handleFileChange}
                                imagePreviewUrl={imagePreviewUrl}
                                onAudioFileChange={handleAudioFileChange}
                                audioFile={audioFile}
                                audioStartSeconds={audioStartSeconds}
                                onAudioStartSecondsChange={setAudioStartSeconds}
                                onAudioError={(message) => alert(message)}
                                onAudioDecoded={(buffer) => { decodedAudioBufferRef.current = buffer; }}
                                isProcessingAudio={isProcessingAudio}
                            />
                            <div className="submitRow">
                                <button type="submit" className="adminButton adminButton--primary" disabled={isProcessingAudio}>Add Album</button>
                            </div>
                        </form>
                    </section>
                )}

                {activeTab === 'manage' && (
                    <section className="adminPanel">
                        {editingAlbum ? (
                            <>
                                <h2>Edit Album</h2>
                                <form onSubmit={handleEditSubmit} className="albumForm">
                                    <AlbumFormFields
                                        formData={editFormData}
                                        onInputChange={handleEditInputChange}
                                        availableGenres={availableGenres}
                                        newGenreLabel={editNewGenreLabel}
                                        onNewGenreLabelChange={setEditNewGenreLabel}
                                        onAddGenre={handleEditAddGenre}
                                        onToggleGenre={toggleEditGenre}
                                        onFileChange={handleEditFileChange}
                                        imagePreviewUrl={editImagePreviewUrl}
                                        existingImageUrl={editingAlbum.image_url}
                                        onAudioFileChange={handleEditAudioFileChange}
                                        audioFile={editAudioFile}
                                        audioStartSeconds={editAudioStartSeconds}
                                        onAudioStartSecondsChange={setEditAudioStartSeconds}
                                        onAudioError={(message) => alert(message)}
                                        onAudioDecoded={(buffer) => { editDecodedAudioBufferRef.current = buffer; }}
                                        existingAudioUrl={editingAlbum.preview_audio_url}
                                        isProcessingAudio={editIsProcessingAudio}
                                    />
                                    <div className="submitRow">
                                        <button type="button" className="adminButton" onClick={cancelEditingAlbum}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="adminButton adminButton--primary" disabled={editIsProcessingAudio || isSavingEdit}>
                                            {isSavingEdit ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <>
                                <div className="albumListHeader">
                                    <h2>Manage Albums</h2>
                                    <button type="button" className="adminButton" onClick={loadAlbumsList} disabled={albumsLoading}>
                                        Refresh
                                    </button>
                                </div>
                                {albumsLoading && <p className="formHint">Loading albums&hellip;</p>}
                                {!albumsLoading && albums.length === 0 && <p className="formHint">No albums found.</p>}
                                <ul className="albumList">
                                    {albums.map(album => (
                                        <li key={album.id} className="albumListItem">
                                            {album.image_url && (
                                                <img src={optimizeCloudinaryUrl(album.image_url, 120)} alt="" className="albumListThumb" />
                                            )}
                                            <div className="albumListInfo">
                                                <p className="albumListTitle">
                                                    {album.name}
                                                    {album.hidden && <span className="hiddenBadge">Hidden</span>}
                                                </p>
                                                <p className="albumListMeta">{album.artist} &middot; {album.year_released}</p>
                                            </div>
                                            <div className="albumListActions">
                                                <button type="button" className="adminButton" onClick={() => startEditingAlbum(album)}>
                                                    Edit
                                                </button>
                                                <button type="button" className="adminButton" onClick={() => handleToggleHidden(album)}>
                                                    {album.hidden ? 'Unhide' : 'Hide'}
                                                </button>
                                                <button type="button" className="adminButton adminButton--danger" onClick={() => handleDeleteAlbum(album)}>
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>
                )}

                {activeTab === 'submissions' && (
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
                                        formData={reviewFormData}
                                        onInputChange={handleReviewInputChange}
                                        availableGenres={availableGenres}
                                        newGenreLabel={reviewNewGenreLabel}
                                        onNewGenreLabelChange={setReviewNewGenreLabel}
                                        onAddGenre={handleReviewAddGenre}
                                        onToggleGenre={toggleReviewGenre}
                                        onFileChange={e => setReviewImageFile(e.target.files?.[0] ?? null)}
                                        imagePreviewUrl={reviewImagePreviewUrl}
                                        existingImageUrl={reviewing.image_url}
                                        onAudioFileChange={handleReviewAudioFileChange}
                                        audioFile={reviewAudioFile}
                                        audioStartSeconds={reviewAudioStartSeconds}
                                        onAudioStartSecondsChange={setReviewAudioStartSeconds}
                                        onAudioError={(message) => alert(message)}
                                        onAudioDecoded={(buffer) => { reviewDecodedAudioBufferRef.current = buffer; }}
                                        existingAudioUrl={reviewing.preview_audio_url}
                                        isProcessingAudio={reviewIsProcessingAudio}
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
                                            disabled={isSavingReview || reviewIsProcessingAudio || reviewAudioLoading || reviewing.status === 'published'}
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
                                    {(['pending', 'published', 'rejected', 'all'] as SubmissionFilter[]).map(f => (
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
                )}

                {activeTab === 'comments' && (
                    <section className="adminPanel">
                        <h2>Fan Notes</h2>
                        {albumsLoading && <p className="formHint">Loading albums&hellip;</p>}
                        <div className="formGroup">
                            <label htmlFor="commentsAlbumSearch">Album</label>
                            <input
                                id="commentsAlbumSearch"
                                type="search"
                                placeholder="Search by album or artist&hellip;"
                                value={commentsSearch}
                                onChange={e => setCommentsSearch(e.target.value)}
                            />
                        </div>
                        <div className="coverPicker">
                            {filteredCommentsAlbums.length === 0 && !albumsLoading && (
                                <p className="formHint">No albums match.</p>
                            )}
                            {filteredCommentsAlbums.map(album => (
                                <button
                                    key={album.id}
                                    type="button"
                                    className={`coverPickerItem${album.id === commentsAlbumId ? ' coverPickerItem--selected' : ''}`}
                                    onClick={() => setCommentsAlbumId(album.id)}
                                    title={`${album.name} · ${album.artist}`}
                                >
                                    <img src={optimizeCloudinaryUrl(album.image_url, 200)} alt="" loading="lazy" />
                                    <span className="coverPickerName">{album.name}</span>
                                    <span className="coverPickerArtist">{album.artist}</span>
                                    {(album.comments?.length ?? 0) > 0 && (
                                        <span className="coverPickerBadge">{album.comments!.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        {commentsAlbum && (
                            <h3 className="coverPickerSelected">
                                {commentsAlbum.name} &middot; {commentsAlbum.artist}
                            </h3>
                        )}

                        {commentsAlbum && (
                            <>
                                {(commentsAlbum.comments ?? []).length === 0 && (
                                    <p className="formHint">No fan notes yet.</p>
                                )}
                                <ul className="commentList">
                                    {(commentsAlbum.comments ?? []).map(comment => (
                                        <li key={comment.id} className="commentListItem">
                                            <div className="commentListInfo">
                                                <p className="commentListName">{comment.name}</p>
                                                <p className="commentListText">{comment.text}</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="adminButton adminButton--danger"
                                                onClick={() => handleRemoveComment(comment.id)}
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                </ul>

                                <form onSubmit={handleAddComment} className="albumForm">
                                    <div className="formSection">
                                        <p className="formSectionTitle">Add a Fan Note</p>
                                        <div className="formGroup">
                                            <label htmlFor="commentName">Name</label>
                                            <input
                                                type="text"
                                                id="commentName"
                                                value={newCommentName}
                                                onChange={e => setNewCommentName(e.target.value)}
                                            />
                                        </div>
                                        <div className="formGroup">
                                            <label htmlFor="commentText">Comment</label>
                                            <textarea
                                                id="commentText"
                                                value={newCommentText}
                                                onChange={e => setNewCommentText(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                    <div className="submitRow">
                                        <button type="submit" className="adminButton adminButton--primary" disabled={isSavingComment}>
                                            {isSavingComment ? 'Adding…' : 'Add Fan Note'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </section>
                )}

                {activeTab === 'placeholders' && (
                    <section className="adminPanel">
                        <h2>Placeholder Albums</h2>
                        <p className="formHint">
                            When there aren&rsquo;t enough real albums to fill the home page (Top 3 + Still Fresh,
                            13 cards total), these fill the empty slots so visitors can see what a full page looks
                            like. They&rsquo;re never clickable and never show up in the Archive.
                        </p>
                        {!placeholderSettingsLoaded ? (
                            <p className="formHint">Loading&hellip;</p>
                        ) : (
                            <form onSubmit={handleSavePlaceholderSettings} className="albumForm">
                                <div className="formSection">
                                    <label className="adminCheckbox">
                                        <input
                                            type="checkbox"
                                            checked={placeholderSettings.enabled}
                                            onChange={e =>
                                                setPlaceholderSettings(prev => ({ ...prev, enabled: e.target.checked }))
                                            }
                                        />
                                        Show placeholder albums
                                    </label>
                                    <div className="formGroup">
                                        <label htmlFor="placeholderCount">How many (0&ndash;13)</label>
                                        <input
                                            type="number"
                                            id="placeholderCount"
                                            min={0}
                                            max={13}
                                            value={placeholderSettings.count}
                                            onChange={e =>
                                                setPlaceholderSettings(prev => ({
                                                    ...prev,
                                                    count: Math.max(0, Math.min(13, Number(e.target.value) || 0)),
                                                }))
                                            }
                                        />
                                    </div>
                                    <div className="formRow">
                                        <div className="formGroup">
                                            <label htmlFor="placeholderTitle">Title</label>
                                            <input
                                                type="text"
                                                id="placeholderTitle"
                                                value={placeholderSettings.title}
                                                onChange={e =>
                                                    setPlaceholderSettings(prev => ({ ...prev, title: e.target.value }))
                                                }
                                            />
                                        </div>
                                        <div className="formGroup">
                                            <label htmlFor="placeholderArtist">Artist</label>
                                            <input
                                                type="text"
                                                id="placeholderArtist"
                                                value={placeholderSettings.artist}
                                                onChange={e =>
                                                    setPlaceholderSettings(prev => ({ ...prev, artist: e.target.value }))
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="formGroup">
                                        <label htmlFor="placeholderImage">Cover Image</label>
                                        <input
                                            type="file"
                                            id="placeholderImage"
                                            accept="image/*"
                                            onChange={handlePlaceholderFileChange}
                                        />
                                        {(placeholderImagePreviewUrl || placeholderSettings.image_url) && (
                                            <img
                                                src={
                                                    placeholderImagePreviewUrl ||
                                                    optimizeCloudinaryUrl(placeholderSettings.image_url, 320)
                                                }
                                                alt="Placeholder cover preview"
                                                className="coverPreview"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="submitRow">
                                    <button type="submit" className="adminButton adminButton--primary" disabled={isSavingPlaceholders}>
                                        {isSavingPlaceholders ? 'Saving…' : 'Save Placeholder Settings'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </section>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
