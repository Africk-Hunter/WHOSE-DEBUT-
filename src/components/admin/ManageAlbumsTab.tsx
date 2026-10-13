import React, { useState } from 'react';
import {
    updateAlbumInFirebase,
    deleteAlbumFromFirebase,
    updateAlbumHidden,
    buildAlbumUpdatePayload,
} from '../../utilities/database/firebaseInteractions';
import { GenreEntry, albumGenres } from '../../utilities/genres';
import { Album } from '../../utilities/types';
import { optimizeCloudinaryUrl } from '../../utilities/cloudinary';
import { trimAndUploadPreview, uploadCoverForForm } from '../../utilities/albumUploads';
import { sortAlbumsNewestFirst } from '../../utilities/albumSorting';
import { useAlbumForm } from '../../hooks/useAlbumForm';
import AlbumFormFields from './AlbumFormFields';

interface ManageAlbumsTabProps {
    albums: Album[];
    setAlbums: React.Dispatch<React.SetStateAction<Album[]>>;
    albumsLoading: boolean;
    onRefresh: () => void;
    availableGenres: GenreEntry[];
    onGenreCreated: (genre: GenreEntry) => void;
}

const ManageAlbumsTab: React.FC<ManageAlbumsTabProps> = ({
    albums,
    setAlbums,
    albumsLoading,
    onRefresh,
    availableGenres,
    onGenreCreated,
}) => {
    const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
    const [isSavingEdit, setIsSavingEdit] = useState(false);
    const form = useAlbumForm(onGenreCreated);
    const { formData, imageFile, audioFile, audioStartSeconds, isProcessingAudio } = form;

    const startEditingAlbum = (album: Album) => {
        setEditingAlbum(album);
        form.setFormData({
            title: album.name ?? '',
            artist: album.artist ?? '',
            releaseDate: album.year_released ?? '',
            genres: albumGenres(album),
            releaseType: album.release_type ?? 'album',
            description: album.artist_review ?? '',
            fromafan: album.from_a_peer ?? '',
            spotify: album.spotify ?? '',
            apple: album.apple ?? '',
            bandcamp: album.bandcamp ?? '',
            amazon: album.amazon ?? '',
            previewSongName: album.preview_song_name ?? '',
        });
        form.resetMedia();
        form.setNewGenreLabel('');
    };

    const cancelEditingAlbum = () => {
        setEditingAlbum(null);
        form.resetMedia();
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAlbum) return;

        if (formData.genres.length === 0) {
            alert('Select at least one genre.');
            return;
        }

        const imageUrl = imageFile ? await uploadCoverForForm(imageFile, formData) : '';

        let previewAudioUrl = '';
        if (audioFile) {
            form.setIsProcessingAudio(true);
            const uploaded = await trimAndUploadPreview(audioFile, audioStartSeconds, form.decodedAudioBufferRef.current, formData);
            form.setIsProcessingAudio(false);
            if (uploaded === null) return;
            previewAudioUrl = uploaded;
        }

        setIsSavingEdit(true);
        const success = await updateAlbumInFirebase(editingAlbum.id, formData, imageUrl || undefined, previewAudioUrl || undefined);
        setIsSavingEdit(false);

        if (success) {
            alert('Album updated successfully');
            const updates = buildAlbumUpdatePayload(formData, imageUrl || undefined, previewAudioUrl || undefined);
            setAlbums(prev =>
                sortAlbumsNewestFirst(prev.map(a => (a.id === editingAlbum.id ? { ...a, ...updates } : a)))
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

    return (
        <section className="adminPanel">
            {editingAlbum ? (
                <>
                    <h2>Edit Album</h2>
                    <form onSubmit={handleEditSubmit} className="albumForm">
                        <AlbumFormFields
                            {...form.fieldProps}
                            availableGenres={availableGenres}
                            existingImageUrl={editingAlbum.image_url}
                            existingAudioUrl={editingAlbum.preview_audio_url}
                        />
                        <div className="submitRow">
                            <button type="button" className="adminButton" onClick={cancelEditingAlbum}>
                                Cancel
                            </button>
                            <button type="submit" className="adminButton adminButton--primary" disabled={isProcessingAudio || isSavingEdit}>
                                {isSavingEdit ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </>
            ) : (
                <>
                    <div className="albumListHeader">
                        <h2>Manage Albums</h2>
                        <button type="button" className="adminButton" onClick={onRefresh} disabled={albumsLoading}>
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
    );
};

export default ManageAlbumsTab;
