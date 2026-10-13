import React, { useRef, useState } from 'react';
import { getOrCreateGenre } from '../utilities/database/genreInteractions';
import { GenreEntry } from '../utilities/genres';
import {
    AlbumFormData,
    GENRE_LIMIT_MESSAGE,
    addGenreToForm,
    emptyAlbumForm,
    toggleGenreOnForm,
} from '../utilities/albumForm';
import { useObjectUrl } from './useObjectUrl';

// Form + cover + preview-audio state shared by the Add, Edit and Review forms.
export function useAlbumForm(onGenreCreated: (genre: GenreEntry) => void) {
    const [formData, setFormData] = useState<AlbumFormData>(emptyAlbumForm);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [audioStartSeconds, setAudioStartSeconds] = useState(0);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [newGenreLabel, setNewGenreLabel] = useState('');
    const decodedAudioBufferRef = useRef<AudioBuffer | null>(null);
    const imagePreviewUrl = useObjectUrl(imageFile);

    const updateGenres = (change: (form: AlbumFormData) => AlbumFormData | null) => {
        setFormData(prev => {
            const next = change(prev);
            if (!next) {
                alert(GENRE_LIMIT_MESSAGE);
                return prev;
            }
            return next;
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const toggleGenre = (slug: string) => updateGenres(form => toggleGenreOnForm(form, slug));

    const handleAddGenre = async () => {
        const label = newGenreLabel.trim();
        if (!label) return;
        const entry = await getOrCreateGenre(label);
        onGenreCreated(entry);
        setNewGenreLabel('');
        updateGenres(form => addGenreToForm(form, entry.slug));
    };

    // Clears the cover and audio selections (not the text fields or genre label).
    const resetMedia = () => {
        setImageFile(null);
        setAudioFile(null);
        setAudioStartSeconds(0);
        decodedAudioBufferRef.current = null;
    };

    const fieldProps = {
        formData,
        onInputChange: handleInputChange,
        newGenreLabel,
        onNewGenreLabelChange: setNewGenreLabel,
        onAddGenre: handleAddGenre,
        onToggleGenre: toggleGenre,
        onFileChange: handleImageFileChange,
        imagePreviewUrl,
        onAudioFileChange: handleAudioFileChange,
        audioFile,
        audioStartSeconds,
        onAudioStartSecondsChange: setAudioStartSeconds,
        onAudioError: (message: string) => alert(message),
        onAudioDecoded: (buffer: AudioBuffer) => { decodedAudioBufferRef.current = buffer; },
        isProcessingAudio,
    };

    return {
        formData,
        setFormData,
        imageFile,
        setImageFile,
        audioFile,
        setAudioFile,
        audioStartSeconds,
        setAudioStartSeconds,
        isProcessingAudio,
        setIsProcessingAudio,
        setNewGenreLabel,
        decodedAudioBufferRef,
        resetMedia,
        fieldProps,
    };
}
