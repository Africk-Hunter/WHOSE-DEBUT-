function addAlbumToLocalStorage(album: { id: string }) {
    let currentAlbums = localStorage.getItem('albums');
    if (currentAlbums === null) {
        localStorage.setItem('albums', JSON.stringify([album]));
    } else {
        const parsed = JSON.parse(currentAlbums);
        if (Array.isArray(parsed) && !parsed.some((a: { id: string }) => a.id === album.id)) {
            parsed.push(album);
            localStorage.setItem('albums', JSON.stringify(parsed));
        }
    }
}

function sortAlbumsByReleaseDate() {
    const parsed = getParsedLocalStorage()
    if (Array.isArray(parsed)) {
        let sortedAlbums = parsed.sort((b, a) => new Date(a.year_released).getTime() - new Date(b.year_released).getTime());
        localStorage.setItem('albums', JSON.stringify(sortedAlbums));
    }
}

function pullAlbumInfoByID(ID: string) {
    const parsed = getParsedLocalStorage()
    if (Array.isArray(parsed)) {
        for (var i = 0; i < parsed.length; i++) {
            if (parsed[i].id == ID) {
                return parsed[i]
            }
        }
    }
    return null;
}

function getParsedLocalStorage() {
    let storedAlbums = localStorage.getItem('albums');
    if (storedAlbums) {
        return JSON.parse(storedAlbums);
    }
    return [];
}

function setGenresInLocalStorage(genres: object[]) {
    localStorage.setItem('genres', JSON.stringify(genres));
}

function getParsedGenres() {
    const storedGenres = localStorage.getItem('genres');
    if (storedGenres) {
        return JSON.parse(storedGenres);
    }
    return [];
}

export {
    addAlbumToLocalStorage,
    sortAlbumsByReleaseDate,
    pullAlbumInfoByID,
    getParsedLocalStorage,
    setGenresInLocalStorage,
    getParsedGenres,
};