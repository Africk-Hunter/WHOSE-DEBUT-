import { supabase } from '../utilities/database/supabaseClient';

async function loadAlbumsFromDatabase() {
    const { data: fetchedAlbums, error } = await supabase.from('Albums').select()
    fetchedAlbums?.forEach(album => {
        addAlbumToLocalStorage(album);
    })
}

function addAlbumToLocalStorage(album: object) {
    let currentAlbums = localStorage.getItem('albums');
    if (currentAlbums === null) {
        localStorage.setItem('albums', JSON.stringify([album]));
    } else {
        const parsed = JSON.parse(currentAlbums);
        if (Array.isArray(parsed) && !checkIfItemExists(JSON.stringify([album]))) {
            parsed.push(album);
            localStorage.setItem('albums', JSON.stringify(parsed));
        }
    }
}

const checkIfItemExists = (key: string): boolean => {
    const itemValue = localStorage.getItem(key);
    return itemValue !== null && itemValue !== undefined;
};

function sortAlbumsByReleaseDate() {
    let storedAlbums = localStorage.getItem('albums');
    if (storedAlbums) {
        const parsed = JSON.parse(storedAlbums);
        if (Array.isArray(parsed)) {
            let sortedAlbums = parsed.sort((b, a) => new Date(a.year_released).getTime() - new Date(b.year_released).getTime());
            localStorage.setItem('albums', JSON.stringify(sortedAlbums));
        }
    }
}

export { loadAlbumsFromDatabase, sortAlbumsByReleaseDate };