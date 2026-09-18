import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/database/firebaseClient';
import { uploadCoverToCloudinary, submitAlbumToFirebase, seedTestAlbums } from '../utilities/database/firebaseInteractions';
import { fetchAllGenres, seedGenresIfEmpty, getOrCreateGenre } from '../utilities/database/genreInteractions';
import { previewGenreMigration, runGenreMigration, MigrationReport } from '../utilities/database/migrateGenres';
import { GenreEntry, SEED_GENRES } from '../utilities/genres';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/admin');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const [albumData, setAlbumData] = useState({
        title: '',
        artist: '',
        releaseDate: '',
        genres: [] as string[],
        description: '',
        fromapeer: '',
        spotify: '',
        apple: '',
        bandcamp: '',
        amazon: ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

    const [availableGenres, setAvailableGenres] = useState<GenreEntry[]>([]);
    const [newGenreLabel, setNewGenreLabel] = useState('');

    const [migrationReport, setMigrationReport] = useState<MigrationReport | null>(null);
    const [migrationResult, setMigrationResult] = useState<{ converted: number } | null>(null);

    useEffect(() => {
        const initGenres = async () => {
            await seedGenresIfEmpty(SEED_GENRES);
            setAvailableGenres(await fetchAllGenres());
        };
        initGenres();
    }, []);

    useEffect(() => {
        if (!imageFile) {
            setImagePreviewUrl(null);
            return;
        }
        const objectUrl = URL.createObjectURL(imageFile);
        setImagePreviewUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [imageFile]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAlbumData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const selectGenre = (slug: string) => {
        setAlbumData(prev => {
            if (prev.genres.includes(slug)) return prev;
            if (prev.genres.length >= 3) {
                alert('You can select up to 3 genres. Remove one first.');
                return prev;
            }
            return { ...prev, genres: [...prev.genres, slug] };
        });
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
        selectGenre(entry.slug);
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

        if (await submitAlbumToFirebase(albumData, imageUrl)) {
            setAlbumData({
                title: '',
                artist: '',
                releaseDate: '',
                genres: [],
                description: '',
                fromapeer: '',
                spotify: '',
                apple: '',
                bandcamp: '',
                amazon: ''
            });
            setImageFile(null);
        }
    };

    async function handleSeedAlbums() {
        await seedTestAlbums();
        alert('15 test albums added successfully');
    }

    async function handleLogout() {
        await signOut(auth);
        navigate('/');
    }

    return (
        <div className="adminDash">
            <h1 className="panelLabel">Admin Panel</h1>
            <section className="albumAdd">
                <h2>Add New Album</h2>
                <form onSubmit={handleSubmit} className="albumForm">
                    <div className="formSection">
                        <p className="formSectionTitle">Basic Info</p>
                        <div className="formRow">
                            <div className="formGroup">
                                <label htmlFor="title">Album Title</label>
                                <input type="text" id="title" name="title" value={albumData.title} onChange={handleInputChange} required />
                            </div>
                            <div className="formGroup">
                                <label htmlFor="artist">Artist Name</label>
                                <input type="text" id="artist" name="artist" value={albumData.artist} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="formRow">
                            <div className="formGroup">
                                <label htmlFor="releaseDate">Release Date</label>
                                <input type="date" id="releaseDate" name="releaseDate" value={albumData.releaseDate} onChange={handleInputChange} required />
                            </div>
                        </div>
                        <div className="formGroup genrePicker">
                            <label>Genres (choose up to 3)</label>
                            <div className="genreChipGrid">
                                {availableGenres.map(g => (
                                    <button
                                        type="button"
                                        key={g.slug}
                                        className={`genreChip ${albumData.genres.includes(g.slug) ? 'genreChip--active' : ''}`}
                                        aria-pressed={albumData.genres.includes(g.slug)}
                                        onClick={() => toggleGenre(g.slug)}
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
                                    onChange={e => setNewGenreLabel(e.target.value)}
                                />
                                <button type="button" className="adminButton" onClick={handleAddGenre}>
                                    Add
                                </button>
                            </div>
                            <p className="formHint">{albumData.genres.length}/3 selected</p>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="imageFile">Album Cover Image</label>
                            <input type="file" id="imageFile" name="imageFile" accept="image/*" onChange={handleFileChange} />
                            {imagePreviewUrl && (
                                <img src={imagePreviewUrl} alt="Cover preview" className="coverPreview" />
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
                            <textarea id="description" name="description" value={albumData.description} onChange={handleInputChange} rows={4} />
                        </div>
                        <div className="formGroup">
                            <label htmlFor="fromapeer">From a Peer</label>
                            <textarea id="fromapeer" name="fromapeer" value={albumData.fromapeer} onChange={handleInputChange} rows={4} />
                        </div>
                    </div>

                    <div className="formSection">
                        <p className="formSectionTitle">Streaming Links</p>
                        <div className="formRow">
                            <div className="formGroup">
                                <label htmlFor="spotify">Spotify</label>
                                <input type="text" id="spotify" name="spotify" value={albumData.spotify} onChange={handleInputChange} />
                            </div>
                            <div className="formGroup">
                                <label htmlFor="apple">Apple Music</label>
                                <input type="text" id="apple" name="apple" value={albumData.apple} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="formRow">
                            <div className="formGroup">
                                <label htmlFor="bandcamp">Bandcamp</label>
                                <input type="text" id="bandcamp" name="bandcamp" value={albumData.bandcamp} onChange={handleInputChange} />
                            </div>
                            <div className="formGroup">
                                <label htmlFor="amazon">Amazon Music</label>
                                <input type="text" id="amazon" name="amazon" value={albumData.amazon} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    <div className="submitRow">
                        <button type="submit" className="adminButton">Add Album</button>
                    </div>
                </form>
            </section>
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
        </div>
    );
};

export default AdminDashboard;
