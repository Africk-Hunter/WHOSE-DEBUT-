import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/database/firebaseClient';
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
import { fetchAllGenres, seedGenresIfEmpty, getOrCreateGenre } from '../utilities/database/genreInteractions';
import { previewGenreMigration, runGenreMigration, MigrationReport } from '../utilities/database/migrateGenres';
import { GenreEntry, SEED_GENRES, albumGenres } from '../utilities/genres';
import { Album, FanComment } from '../utilities/types';
import { optimizeCloudinaryUrl } from '../utilities/cloudinary';
import LoadingScreen from '../components/LoadingScreen';
import AudioClipSelector from '../components/AudioClipSelector';

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

type Tab = 'add' | 'manage' | 'comments' | 'migration';

interface AlbumFormFieldsProps {
    formData: AlbumFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    availableGenres: GenreEntry[];
    newGenreLabel: string;
    onNewGenreLabelChange: (value: string) => void;
    onAddGenre: () => void;
    onToggleGenre: (slug: string) => void;
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
                        <button
                            type="button"
                            key={g.slug}
                            className={`genreChip ${formData.genres.includes(g.slug) ? 'genreChip--active' : ''}`}
                            aria-pressed={formData.genres.includes(g.slug)}
                            onClick={() => onToggleGenre(g.slug)}
                        >
                            {g.label}
                        </button>
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
            <div className="formGroup">
                <label htmlFor="fromafan">From a Fan</label>
                <textarea id="fromafan" name="fromafan" value={formData.fromafan} onChange={onInputChange} rows={4} />
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
    const [newCommentName, setNewCommentName] = useState('');
    const [newCommentText, setNewCommentText] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);

    const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
    const [migrationResult, setMigrationResult] = useState<{ converted: number } | null>(null);

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
                    console.error('Error processing preview audio:', error);
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
                    console.error('Error processing preview audio:', error);
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

    const handlePreviewMigration = async () => {
        setMigrationResult(null);
        setMigrationReport(await previewGenreMigration());
    };

    const handleRunMigration = async () => {
        if (!migrationReport) return;
        const confirmed = window.confirm(
            `This will update ${migrationReport.toConvert} album(s) and create ${migrationReport.newGenres.length} new genre(s). Continue?`
        );
        if (!confirmed) return;
        const result = await runGenreMigration();
        setMigrationResult(result);
        setMigrationReport(null);
        setAvailableGenres(await fetchAllGenres());
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

    return (
        <div className="adminDash">
            <h1 className="panelLabel">Admin Panel</h1>

            <div className="adminTabs">
                <button
                    type="button"
                    className={`adminTab ${activeTab === 'add' ? 'adminTab--active' : ''}`}
                    onClick={() => setActiveTab('add')}
                >
                    Add Album
                </button>
                <button
                    type="button"
                    className={`adminTab ${activeTab === 'manage' ? 'adminTab--active' : ''}`}
                    onClick={() => setActiveTab('manage')}
                >
                    Manage Albums
                </button>
                <button
                    type="button"
                    className={`adminTab ${activeTab === 'comments' ? 'adminTab--active' : ''}`}
                    onClick={() => setActiveTab('comments')}
                >
                    Comments
                </button>
                <button
                    type="button"
                    className={`adminTab ${activeTab === 'migration' ? 'adminTab--active' : ''}`}
                    onClick={() => setActiveTab('migration')}
                >
                    Genre Migration
                </button>
            </div>

            {activeTab === 'add' && (
                <section className="albumAdd">
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
                            <button type="submit" className="adminButton" disabled={isProcessingAudio}>Add Album</button>
                        </div>
                    </form>
                </section>
            )}

            {activeTab === 'manage' && (
                <section className="albumAdd">
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
                                    <button type="submit" className="adminButton" disabled={editIsProcessingAudio || isSavingEdit}>
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

            {activeTab === 'comments' && (
                <section className="albumAdd">
                    <h2>Fan Notes</h2>
                    {albumsLoading && <p className="formHint">Loading albums&hellip;</p>}
                    <div className="formGroup">
                        <label htmlFor="commentsAlbum">Album</label>
                        <select
                            id="commentsAlbum"
                            value={commentsAlbumId}
                            onChange={e => setCommentsAlbumId(e.target.value)}
                        >
                            <option value="">Select an album&hellip;</option>
                            {albums.map(album => (
                                <option key={album.id} value={album.id}>
                                    {album.name} &middot; {album.artist}
                                </option>
                            ))}
                        </select>
                    </div>

                    {commentsAlbum && (
                        <>
                            <ul className="commentList">
                                {(commentsAlbum.comments ?? []).length === 0 && (
                                    <p className="formHint">No comments yet.</p>
                                )}
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
                                    <p className="formSectionTitle">Add a Comment</p>
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
                                    <button type="submit" className="adminButton" disabled={isSavingComment}>
                                        {isSavingComment ? 'Adding…' : 'Add Comment'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </section>
            )}

            {activeTab === 'migration' && (
                <section className="genreMigration">
                    <h2>Genre Migration (temporary)</h2>
                    <p className="formHint">
                        Converts any album still storing genres as free text into the canonical slug list above.
                        Always preview first &mdash; nothing is written until you run the migration.
                    </p>
                    <div className="adminActions">
                        <button type="button" className="adminButton" onClick={handlePreviewMigration}>
                            Preview Migration
                        </button>
                        <button
                            type="button"
                            className="adminButton"
                            onClick={handleRunMigration}
                            disabled={!migrationReport || migrationReport.toConvert === 0}
                        >
                            Run Migration
                        </button>
                    </div>
                    {migrationReport && (
                        <div className="migrationReport">
                            <p>{migrationReport.totalAlbums} albums total &middot; {migrationReport.toConvert} to convert</p>
                            {migrationReport.newGenres.length > 0 && (
                                <>
                                    <p>New genres that would be created:</p>
                                    <ul>
                                        {migrationReport.newGenres.map(g => (
                                            <li key={g.slug}>{g.label} ({g.slug})</li>
                                        ))}
                                    </ul>
                                </>
                            )}
                            <ul className="migrationItems">
                                {migrationReport.items.filter(item => !item.alreadyCanonical).map(item => (
                                    <li key={item.albumId}>
                                        {item.albumName}: {item.resolved.map(r => `${r.label}${r.status === 'new' ? ' (new)' : ''}`).join(', ')}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {migrationResult && <p>Converted {migrationResult.converted} album(s).</p>}
                </section>
            )}

            <div className="adminActions">
                <button onClick={() => navigate('/')} className="adminButton">
                    Return to Main Site
                </button>
                <button onClick={handleSeedAlbums} className="adminButton">
                    Seed 15 Test Albums
                </button>
                <button onClick={handleLogout} className="adminButton">
                    Logout
                </button>
            </div>
        </div>
    );
};

export default AdminDashboard;
