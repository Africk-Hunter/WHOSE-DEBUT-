import React from 'react';
import { submitAlbumToFirebase } from '../../utilities/database/firebaseInteractions';
import { countAlbumsUsingGenre, deleteGenre } from '../../utilities/database/genreInteractions';
import { GenreEntry } from '../../utilities/genres';
import { emptyAlbumForm, removeGenreFromForm } from '../../utilities/albumForm';
import { trimAndUploadPreview, uploadCoverForForm } from '../../utilities/albumUploads';
import { useAlbumForm } from '../../hooks/useAlbumForm';
import AlbumFormFields from './AlbumFormFields';

interface AddAlbumTabProps {
    availableGenres: GenreEntry[];
    onGenreCreated: (genre: GenreEntry) => void;
    onGenreDeleted: (slug: string) => void;
    onAlbumAdded: () => void;
}

const AddAlbumTab: React.FC<AddAlbumTabProps> = ({ availableGenres, onGenreCreated, onGenreDeleted, onAlbumAdded }) => {
    const form = useAlbumForm(onGenreCreated);
    const { formData, imageFile, audioFile, audioStartSeconds, isProcessingAudio } = form;

    const handleDeleteGenre = async (genre: GenreEntry) => {
        try {
            const usage = await countAlbumsUsingGenre(genre.slug);
            const warning = usage > 0
                ? `"${genre.label}" is still used by ${usage} album(s). They'll keep the slug but it won't display as a known genre. Delete anyway?`
                : `Delete genre "${genre.label}"?`;
            if (!window.confirm(warning)) return;
            await deleteGenre(genre.slug);
            onGenreDeleted(genre.slug);
            form.setFormData(prev => removeGenreFromForm(prev, genre.slug));
        } catch (error) {
            console.error('Error deleting genre:', error);
            alert('Failed to delete genre.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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

        if (await submitAlbumToFirebase(formData, imageUrl, previewAudioUrl || undefined)) {
            form.setFormData(emptyAlbumForm);
            form.resetMedia();
            onAlbumAdded();
        }
    };

    return (
        <section className="adminPanel">
            <h2>Add New Album</h2>
            <form onSubmit={handleSubmit} className="albumForm">
                <AlbumFormFields
                    {...form.fieldProps}
                    availableGenres={availableGenres}
                    onDeleteGenre={handleDeleteGenre}
                />
                <div className="submitRow">
                    <button type="submit" className="adminButton adminButton--primary" disabled={isProcessingAudio}>Add Album</button>
                </div>
            </form>
        </section>
    );
};

export default AddAlbumTab;
