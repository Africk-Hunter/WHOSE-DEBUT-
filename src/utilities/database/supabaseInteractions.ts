import { supabase } from './supabaseClient';
import { addAlbumToLocalStorage } from '../localStorageHandling';

interface AlbumData {
    title: string;
    artist: string;
    releaseDate: string;
    genre: string;
    description: string;
    fromapeer: string;
    spotify: string;
    apple: string;
    amazon: string;
    bandcamp: string;
}

async function loadAlbumsFromDatabase() {
    const { data: fetchedAlbums, error } = await supabase.from('Albums').select()
    if (error) {
        console.error('Error fetching albums:', error);
        return;
    }
    fetchedAlbums?.forEach(album => {
        addAlbumToLocalStorage(album);
    })
}

async function uploadCoverToSupabase(fileName: string, imageFile: File) {
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('Album_Covers')
        .upload(fileName, imageFile);

    if (uploadError) {
        console.error('Error uploading image:', uploadError);
        alert('Failed to upload image: ' + uploadError.message);
        return "";
    } else {
        console.log('Upload successful:', uploadData);
        const { data: { publicUrl } } = supabase.storage
            .from('Album_Covers')
            .getPublicUrl(fileName);
        console.log('Public URL:', publicUrl);
        return publicUrl;
    }
}

async function submitAlbumToSupabase(albumData: AlbumData, imageUrl: string) {
    const { error } = await supabase.from('Albums').insert([
        {
            name: albumData.title,
            artist: albumData.artist,
            year_released: albumData.releaseDate,
            artist_review: albumData.description,
            from_a_peer: albumData.fromapeer,
            genres: albumData.genre,
            spotify: albumData.spotify,
            apple: albumData.apple,
            bandcamp: albumData.bandcamp,
            amazon: albumData.amazon,
            image_url: imageUrl
        },
    ]);

    if (error) {
        console.error('Error adding album:', error);
        alert('Failed to add album: ' + error.message);
        return false;
    } else {
        console.log('Album added successfully');
        alert('Album added successfully');
        return true;
    }
}

export { loadAlbumsFromDatabase, uploadCoverToSupabase, submitAlbumToSupabase }