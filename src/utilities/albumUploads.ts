import { uploadCoverToCloudinary, uploadPreviewAudioToCloudinary } from './database/firebaseInteractions';
import { trimAudioToWav, AudioProcessingError } from './audio/trimAudioToWav';
import { AlbumFormData, coverFileName, previewAudioFileName } from './albumForm';
import { logError } from './logger';

const PREVIEW_CLIP_SECONDS = 30;

export async function uploadCoverForForm(file: File, form: AlbumFormData): Promise<string> {
    const ext = file.name.split('.').pop();
    return uploadCoverToCloudinary(coverFileName(form, ext), file);
}

// Trims the chosen window to a WAV and uploads it. Returns the URL, or null if
// processing failed (the admin has already been alerted).
export async function trimAndUploadPreview(
    file: File,
    startSeconds: number,
    decoded: AudioBuffer | null,
    form: AlbumFormData
): Promise<string | null> {
    try {
        const trimmedWav = await trimAudioToWav(file, PREVIEW_CLIP_SECONDS, startSeconds, decoded ?? undefined);
        return await uploadPreviewAudioToCloudinary(previewAudioFileName(form), trimmedWav);
    } catch (error) {
        if (error instanceof AudioProcessingError) {
            alert(error.message);
        } else {
            logError('Error processing preview audio:', error);
            alert('Failed to process preview audio.');
        }
        return null;
    }
}
