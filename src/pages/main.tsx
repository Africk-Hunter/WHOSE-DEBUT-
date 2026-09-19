import { useRef, useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Album from '../components/Album'
import Footer from '../components/Footer'
import Archive from '../components/Archive';
import LoadingScreen from '../components/LoadingScreen';
import AlbumView from './albumView';

import { sortAlbumsByReleaseDate, getParsedLocalStorage, setGenresInLocalStorage } from '../utilities/localStorageHandling';
import { loadAlbumsFromDatabase } from '../utilities/database/firebaseInteractions';
import { fetchAllGenres } from '../utilities/database/genreInteractions';

function Main() {
    const { albumId } = useParams();
    const location = useLocation();
    const whoseDebutRef = useRef<HTMLElement>(null);
    const stillFreshRef = useRef<HTMLElement>(null);
    const archiveRef = useRef<HTMLElement>(null);
    const [inArchive, setInArchive] = useState(false);
    const [albums, setAlbums] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isMobileWidth = () => window.innerWidth <= 768;

    const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const archive = archiveRef.current;
                    if (!archive) {
                        ticking = false;
                        return;
                    }

                    const archiveRect = archive.getBoundingClientRect();

                    const archiveScrolledInto = archiveRect.top < -50;
                    const backNearTop = archiveRect.top > -10 && archiveRect.top < 100;

                    if (archiveScrolledInto) {
                        if (!inArchive) {
                            setInArchive(true);
                            if (!isMobileWidth()) document.documentElement.style.scrollSnapType = 'none';
                        }
                    } else if (backNearTop) {
                        if (inArchive) {
                            setInArchive(false);
                            if (!isMobileWidth()) document.documentElement.style.scrollSnapType = 'y mandatory';
                        }
                    }

                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (!isMobileWidth()) document.documentElement.style.scrollSnapType = 'y mandatory';
        };
    }, [inArchive]);

    useEffect(() => {
        const init = async () => {
            localStorage.clear();
            await loadAlbumsFromDatabase();
            sortAlbumsByReleaseDate();
            const parsed = getParsedLocalStorage();
            setAlbums(parsed);
            const genres = await fetchAllGenres();
            setGenresInLocalStorage(genres);
            setLoading(false);
        };
        init();

    }, [])

    useEffect(() => {
        if (albumId) document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, [albumId]);

    // Client-side nav doesn't auto-scroll to a URL hash (this is a plain
    // BrowserRouter, not a v6.4+ data router), and albums load async, so
    // this has to watch both the hash and the data — it needs to fire both
    // on a fresh reload landing on the URL and on in-app back-navigation
    // from /album/:id, where Main never remounts.
    useEffect(() => {
        if (albums.length === 0) return;
        if (location.hash === '#stillFresh') {
            stillFreshRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (location.hash === '#archive') {
            archiveRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [location.hash, albums.length]);

    const ranked = useMemo(() => albums.map((a, i) => ({ ...a, rank: i + 1 })), [albums]);
    const heroAlbums = useMemo(() => ranked.slice(0, 3), [ranked]);
    const stillFreshPool = useMemo(() => ranked.slice(3, 13), [ranked]);

    if (loading) return <LoadingScreen />;

    return (
        <section className='all'>
            <main className="main" ref={whoseDebutRef}>
                <section className="topBar topBar--home">
                    <h1 className="pageHeader pageHeader--home">WHOSE DEBUT?</h1>
                </section>
                <p className="tagline">Reno, Nevada. Weekly releases fresh from local artists</p>
                <div className="divider divider--home"></div>
                <section className="topThree">
                    {heroAlbums.map(album => (
                        <Album
                            key={album.id}
                            type={null}
                            title={album.name}
                            artist={album.artist}
                            image={album.image_url}
                            id={album.id}
                            rank={album.rank}
                            genre={album.genres?.[0]}
                        />
                    ))}
                </section>
                <section className="bottomBar">
                    <a href="/about" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(stillFreshRef)}>
                        <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </main>
            <section className="stillFresh" id="stillFresh" ref={stillFreshRef}>
                <section className="topBar">
                    <button className="backArrow" onClick={() => scrollToSection(whoseDebutRef)}>
                        <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                    <h1 className="pageHeader pageHeader--section">STILL FRESH</h1>
                </section>
                <div className="divider"></div>
                <section className="stillFreshAlbums">
                    {stillFreshPool.map(album => (
                        <Album
                            key={album.id}
                            type='stillFresh'
                            title={album.name}
                            artist={album.artist}
                            image={album.image_url}
                            id={album.id}
                            rank={album.rank}
                            genre={album.genres?.[0]}
                        />
                    ))}
                </section>
                <section className="bottomBar">
                    <a href="/about" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(archiveRef)}>
                        <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </section>
            <section className="archRef" id="archive" ref={archiveRef}>
                <Archive />
            </section>
            <Footer />
            {albumId && <AlbumView albumId={albumId} />}
        </section>

    );
}

export default Main;