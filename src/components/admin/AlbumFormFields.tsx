import React from 'react';
import AudioClipSelector from '../AudioClipSelector';
import { GenreEntry } from '../../utilities/genres';
import { RELEASE_TYPES, RELEASE_TYPE_LABELS } from '../../utilities/types';
import { AlbumFormData } from '../../utilities/albumForm';
import { optimizeCloudinaryUrl } from '../../utilities/cloudinary';

export interface AlbumFormFieldsProps {
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
                <div className="formGroup">
                    <label>Release Type</label>
                    <div className="genreChipGrid">
                        {RELEASE_TYPES.map(type => (
                            <label
                                key={type}
                                className={`genreChip releaseTypeChip ${formData.releaseType === type ? 'genreChip--active' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="releaseType"
                                    value={type}
                                    checked={formData.releaseType === type}
                                    onChange={onInputChange}
                                />
                                {RELEASE_TYPE_LABELS[type]}
                            </label>
                        ))}
                    </div>
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

export default AlbumFormFields;
