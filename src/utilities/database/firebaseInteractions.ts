import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseClient';
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
    try {
        const snapshot = await getDocs(collection(db, 'albums'));
        snapshot.forEach(doc => {
            addAlbumToLocalStorage({ id: doc.id, ...doc.data() });
        });
    } catch (error) {
        console.error('Error loading albums from Firestore:', error);
    }
}

async function uploadCoverToCloudinary(fileName: string, imageFile: File): Promise<string> {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', uploadPreset);
    formData.append('public_id', fileName);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json();
        alert('Failed to upload image: ' + err.error?.message);
        return '';
    }

    const data = await response.json();
    return data.secure_url;
}

async function submitAlbumToFirebase(albumData: AlbumData, imageUrl: string): Promise<boolean> {
    try {
        await addDoc(collection(db, 'albums'), {
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
            image_url: imageUrl,
        });
        alert('Album added successfully');
        return true;
    } catch (error) {
        console.error('Error adding album:', error);
        alert('Failed to add album: ' + error);
        return false;
    }
}

export { loadAlbumsFromDatabase, uploadCoverToCloudinary, submitAlbumToFirebase };
