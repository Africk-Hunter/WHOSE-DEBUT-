import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './firebaseClient';
import { addAlbumToLocalStorage } from '../localStorageHandling';
import { GenreSlug, SEED_GENRES } from '../genres';
import { getOrCreateGenre } from './genreInteractions';

interface AlbumData {
    title: string;
    artist: string;
    releaseDate: string;
    genres: GenreSlug[];
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
            genres: albumData.genres,
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

async function seedTestAlbums(): Promise<void> {
    const artists = [
        'The Reno Drifters', 'Sierra Soundwave', 'Desert Echo', 'Neon Sage', 'Basin & Range',
        'Truckee River Revival', 'High Desert Hymns', 'Comstock Collective', 'Biggest Little Sound',
        'Peavine Blues Band', 'Virginia Street Jazz', 'Sagebrush Soul', 'Tahoe Tide',
        'Reno Roots Project', 'The Sparks Collective'
    ];

    const albumTitles = [
        'First Light', 'Dust and Neon', 'Open Range', 'Debut Sessions', 'Silver State Stories',
        'Miles from Anywhere', 'The Long Way Home', 'Desert Bloom', 'New Ground', 'Starting Line',
        'Wide Open', 'First Steps', 'Into the Basin', 'Hello, Reno', 'Uncharted'
    ];

    const artistReviews = [
        'This album came out of two years of playing local venues and finally deciding it was time to capture what we do live. Every track was recorded in one or two takes — we wanted that raw energy.',
        'We wrote these songs during a weird stretch of time when everything felt uncertain. Putting them to tape felt like the only way to make sense of it all.',
        'I started this project in my garage with a four-track recorder. What you hear is exactly what came out of those sessions — no polish, just honesty.',
        "This debut represents everything we've been building toward since we first started playing together at a friend's birthday party three years ago.",
        'We wanted to make something that sounded like driving through the Nevada desert at dusk — wide open and a little lonesome.',
    ];

    const peerReviews = [
        "One of the most honest debuts I've heard from a local act. You can tell these songs were lived in before they were recorded.",
        "This record sounds like it was made by people who actually have something to say. That's rarer than it should be.",
        'Incredible first effort. The production is stripped back in all the right ways and lets the songwriting breathe.',
        'These folks have been a staple of the local scene for years and this album finally does justice to what they bring live.',
        "A remarkable debut that captures the spirit of the Reno music scene in a way I haven't heard before.",
    ];

    const baseYear = 2020;

    for (let i = 0; i < 15; i++) {
        const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
        const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
        const year = baseYear + Math.floor(Math.random() * 5);

        const seedGenre = SEED_GENRES[Math.floor(Math.random() * SEED_GENRES.length)];
        const genre = await getOrCreateGenre(seedGenre.label);

        await addDoc(collection(db, 'albums'), {
            name: albumTitles[i],
            artist: artists[i],
            year_released: `${year}-${month}-${day}`,
            artist_review: artistReviews[i % artistReviews.length],
            from_a_peer: peerReviews[i % peerReviews.length],
            genres: [genre.slug],
            spotify: '',
            apple: '',
            bandcamp: '',
            amazon: '',
            image_url: `https://picsum.photos/seed/${artists[i].replace(/\s+/g, '')}/400/400`,
        });
    }
}

export { loadAlbumsFromDatabase, uploadCoverToCloudinary, submitAlbumToFirebase, seedTestAlbums };
