import { lazy, Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import Album from '../components/Album'
import Footer from '../components/Footer'
import Archive from '../components/Archive';
import LoadingScreen from '../components/LoadingScreen';

const AlbumView = lazy(() => import('./albumView'));

import { sortAlbumsByReleaseDate, getParsedLocalStorage, setGenresInLocalStorage } from '../utilities/localStorageHandling';
import { loadAlbumsFromDatabase } from '../utilities/database/firebaseInteractions';
import { fetchAllGenres } from '../utilities/database/genreInteractions';
import { fetchPlaceholderSettings } from '../utilities/database/placeholderSettings';
import { buildPlaceholderAlbums } from '../utilities/placeholders';
import { logError } from '../utilities/logger';
import type { Album as AlbumType } from '../utilities/types';

function Main() {
    const { albumId } = useParams();
    const location = useLocation();
    const whoseDebutRef = useRef<HTMLElement>(null);
    const stillFreshRef = useRef<HTMLElement>(null);
    const archiveRef = useRef<HTMLElement>(null);
    const homeStickyHeaderRef = useRef<HTMLDivElement>(null);
    const [inArchive, setInArchive] = useState(false);
    const [albums, setAlbums] = useState<AlbumType[]>([]);
    const [placeholders, setPlaceholders] = useState<AlbumType[]>([]);
    const [loading, setLoading] = useState(true);
    const [scrollCueVisible, setScrollCueVisible] = useState(true);

    const isMobileWidth = () => window.innerWidth <= 768;

    const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        ref.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    };

    // On mobile, scrollCueVisible flipping false mid-scroll shrinks the
    // tagline/scrollCue via a 380ms CSS transition, which shortens .main and
    // moves Still Fresh's top out from under the in-flight smooth-scroll
    // target — the page overshoots past it. Collapsing instantly (no
    // transition) before the scroll starts settles that layout shift first,
    // so the target stays put for the whole animation.
    const handleStartScrolling = () => {
        const header = homeStickyHeaderRef.current;
        header?.classList.add('noTransition');
        setScrollCueVisible(false);
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                scrollToSection(stillFreshRef);
                header?.classList.remove('noTransition');
            });
        });
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

                    setScrollCueVisible(window.scrollY < 8);

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
            // All three reads are independent — fire them together so the
            // page waits on the slowest one instead of the sum of all three.
            const [, genresResult, placeholderResult] = await Promise.allSettled([
                loadAlbumsFromDatabase(),
                fetchAllGenres(),
                fetchPlaceholderSettings(),
            ]);
            sortAlbumsByReleaseDate();
            setAlbums(getParsedLocalStorage());
            if (genresResult.status === 'fulfilled') {
                setGenresInLocalStorage(genresResult.value);
            } else {
                logError('Error loading genres from Firestore:', genresResult.reason);
            }
            if (placeholderResult.status === 'fulfilled') {
                setPlaceholders(buildPlaceholderAlbums(placeholderResult.value));
            } else {
                logError('Error loading placeholder settings:', placeholderResult.reason);
            }
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
    // Real albums fill the grid first; placeholders only pad whatever's left
    // over in the 13 home-page slots (3 hero + 10 Still Fresh) — they never
    // reach the Archive, which reads `albums` straight from localStorage.
    const paddedPool = useMemo(() => [...ranked, ...placeholders], [ranked, placeholders]);
    const heroAlbums = useMemo(() => paddedPool.slice(0, 3), [paddedPool]);
    const stillFreshPool = useMemo(() => paddedPool.slice(3, 13), [paddedPool]);

    if (loading) return <LoadingScreen />;

    return (
        <section className='all'>
            <main className="main" ref={whoseDebutRef}>
                <div className="stickyHeader" ref={homeStickyHeaderRef}>
                    <section className="topBar topBar--home">
                        <h1 className="pageHeader pageHeader--home">WHOSE DEBUT?</h1>
                    </section>
                    <p className={`tagline${scrollCueVisible ? '' : ' tagline--collapsed'}`}>
                        <span className="taglineText">Reno, Nevada. Weekly releases fresh from local artists</span>
                    </p>
                    <div className="divider divider--home"></div>
                    <button
                        type="button"
                        className={`scrollCue${scrollCueVisible ? '' : ' scrollCue--hidden'}`}
                        onClick={handleStartScrolling}
                        aria-label="Scroll to the album list"
                    >
                        <span className="scrollCueContent">
                            <span className="scrollCueLabel">START SCROLLING</span>
                            <img src="/images/Arrow.svg" alt="" className="scrollCueArrow" />
                        </span>
                    </button>
                </div>
                <section className="topThree">
                    {heroAlbums.length === 0 ? (
                        <p className="emptyState">No albums yet — check back soon.</p>
                    ) : (
                        heroAlbums.map(album => (
                            <Album
                                key={album.id}
                                type={null}
                                title={album.name}
                                artist={album.artist}
                                image={album.image_url}
                                id={album.id}
                                rank={album.rank}
                                genre={album.genres?.[0]}
                                isPlaceholder={album.isPlaceholder}
                            />
                        ))
                    )}
                </section>
                <section className="bottomBar bottomBar--home">
                    <a href="/submission" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(stillFreshRef)}>
                        <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </main>
            <section className="stillFresh" id="stillFresh" ref={stillFreshRef}>
                <div className="stickyHeader">
                    <section className="topBar">
                        <button className="backArrow" onClick={() => scrollToSection(whoseDebutRef)}>
                            <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                        </button>
                        <h1 className="pageHeader pageHeader--section">STILL FRESH</h1>
                    </section>
                    <div className="divider"></div>
                    <button
                        type="button"
                        className="scrollCue"
                        onClick={() => scrollToSection(archiveRef)}
                        aria-label="Scroll to the archive"
                    >
                        <span className="scrollCueLabel">KEEP SCROLLING</span>
                        <img src="/images/Arrow.svg" alt="" className="scrollCueArrow" />
                    </button>
                </div>
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
                            isPlaceholder={album.isPlaceholder}
                        />
                    ))}
                </section>
                <section className="bottomBar">
                    <a href="/submission" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(archiveRef)}>
                        <img src="/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </section>
            <section className="archRef" id="archive" ref={archiveRef}>
                <Archive />
            </section>
            <Footer />
            {albumId && (
                <Suspense fallback={<LoadingScreen />}>
                    <AlbumView albumId={albumId} />
                </Suspense>
            )}
        </section>

    );
}

export default Main;