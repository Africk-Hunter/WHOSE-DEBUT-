

let albums = [
    {
        name: "1984",
        artist: "Van Halen",
        year: 1984,
        picture: "/images/1984.jpg",
        dateReleased: "1984-01-09",
        dateAdded: "2026-01-10"
    },
    {
        name: "Appetite for Destruction",
        artist: "Guns N' Roses",
        year: 1987,
        picture: "/images/appetite.jpg",
        dateReleased: "1987-07-21",
        dateAdded: "2026-01-12"
    },
    {
        name: "Nevermind",
        artist: "Nirvana",
        year: 1991,
        picture: "/images/nevermind.jpg",
        dateReleased: "1991-09-24",
        dateAdded: "2026-01-13"
    },
    {
        name: "The Chronic",
        artist: "Dr. Dre",
        year: 1992,
        picture: "/images/chronic.jpg",
        dateReleased: "1992-12-15",
        dateAdded: "2026-01-14"
    },
    {
        name: "Is This It",
        artist: "The Strokes",
        year: 2001,
        picture: "/images/isthisit.jpg",
        dateReleased: "2001-07-30",
        dateAdded: "2026-01-15"
    }
]

function loadAlbumsFromDatabase() {

    // Fetch the items from the database
    let fetchedAlbums = albums
    

    fetchedAlbums.forEach(album => {
        let currentAlbums = localStorage.getItem('albums');
        if (currentAlbums === null) {
            localStorage.setItem('albums', JSON.stringify([album]));

        } else {
            const parsed = JSON.parse(currentAlbums);
            if (Array.isArray(parsed)) {
                parsed.push(album);
                localStorage.setItem('albums', JSON.stringify(parsed));
            }
        }
    })
    sortAlbumsByReleaseDate()

}

function sortAlbumsByReleaseDate() {
    let storedAlbums = localStorage.getItem('albums');
    
    if (storedAlbums) {
        const parsed = JSON.parse(storedAlbums);
        if (Array.isArray(parsed)) {
            let sortedAlbums = parsed.sort((a, b) => new Date(a.dateReleased).getTime() - new Date(b.dateReleased).getTime());
            localStorage.setItem('albums', JSON.stringify(sortedAlbums));
        }
    }
    console.log(JSON.stringify(localStorage.getItem('albums')))

}


export { loadAlbumsFromDatabase };