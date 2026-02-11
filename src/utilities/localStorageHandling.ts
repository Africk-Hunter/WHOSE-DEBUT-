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
}

export { addAlbumToLocalStorage, sortAlbumsByReleaseDate, pullAlbumInfoByID, getParsedLocalStorage };