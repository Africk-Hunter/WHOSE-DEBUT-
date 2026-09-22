function sortAlbumsByReleaseDate() {
    const parsed = getParsedLocalStorage()
    if (Array.isArray(parsed)) {
        const sortedAlbums = parsed.sort((b, a) => new Date(a.year_released).getTime() - new Date(b.year_released).getTime());
        localStorage.setItem('albums', JSON.stringify(sortedAlbums));
    }
}

function pullAlbumInfoByID(ID: string) {
    const parsed = getParsedLocalStorage()
    if (Array.isArray(parsed)) {
        for (let i = 0; i < parsed.length; i++) {
            if (parsed[i].id == ID) {
                return parsed[i]
            }
        }
    }
    return null;
}

function getParsedLocalStorage() {
    const storedAlbums = localStorage.getItem('albums');
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
    sortAlbumsByReleaseDate,
    pullAlbumInfoByID,
    getParsedLocalStorage,
    setGenresInLocalStorage,
    getParsedGenres,
};