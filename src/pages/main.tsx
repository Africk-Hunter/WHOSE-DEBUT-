import { useRef, useEffect, useState } from 'react';
import Album from '../components/Album'
import Footer from '../components/Footer'
import ArchiveEntry from '../components/ArchiveEntry';

import { sortAlbumsByReleaseDate } from '../utilities/localStorageHandling';
import { loadAlbumsFromDatabase } from '../utilities/database/supabaseInteractions';

function Main() {
    const whoseDebutRef = useRef<HTMLElement>(null);
    const stillFreshRef = useRef<HTMLElement>(null);
    const archiveRef = useRef<HTMLElement>(null);
    const [inArchive, setInArchive] = useState(false);
    const [albums, setAlbums] = useState<any[]>([]);


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
                            document.documentElement.style.scrollSnapType = 'none';
                        }
                    } else if (backNearTop) {
                        if (inArchive) {
                            setInArchive(false);
                            document.documentElement.style.scrollSnapType = 'y mandatory';
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
            document.documentElement.style.scrollSnapType = 'y mandatory';
        };
    }, [inArchive]);

    useEffect(() => {
        const init = async () => {
            localStorage.clear();
            await loadAlbumsFromDatabase();
            sortAlbumsByReleaseDate();

            const storedAlbums = localStorage.getItem('albums');
            if (storedAlbums) {
                const parsed = JSON.parse(storedAlbums);
                setAlbums(parsed);
            }
        };
        init();
        
    }, [])



    return (
        <section className='all'>
            <main className="main" ref={whoseDebutRef}>
                <section className="topBar">
                    <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                    <h1 className="pageHeader">WHOSE DEBUT?</h1>
                </section>
                <div className="divider"></div>
                <section className="topThree">
                    {albums.slice(0, 3).map((album, index) => (
                        <Album
                            key={index}
                            type={null}
                            title={album.name}
                            artist={album.artist}
                            release_date={album.dateReleased}
                            review={album.artist_review}
                            fromAPeer={album.from_a_peer}
                            image={album.image_url}
                            genres={album.genres}
                            producers={album.produced_by}
                            writers={album.written_by}
                            engineers={album.engineered_by}
                            id={album.id}
                        />
                    ))}
                </section>
                <section className="bottomBar">
                    <a href="" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(stillFreshRef)}>
                        <img src="../../public/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </main>
            <section className="stillFresh" ref={stillFreshRef}>
                <section className="topBar">
                    <button className="backArrow" onClick={() => scrollToSection(whoseDebutRef)}>
                        <img src="../../public/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                    <h1 className="pageHeader">STILL FRESH</h1>
                </section>
                <section className="stillFreshAlbums">
                    {albums.slice(3, 13).map((album, index) => (
                        <Album
                            key={index}
                            type='stillFresh'
                            title={album.name}
                            artist={album.artist}
                            release_date={album.dateReleased}
                            review={album.artist_review}
                            fromAPeer={album.from_a_peer}
                            image={album.image_url}
                            genres={album.genres}
                            producers={album.produced_by}
                            writers={album.written_by}
                            engineers={album.engineered_by}
                            id={album.id}
                        />
                    ))}
                </section>
                <section className="bottomBar">
                    <a href="" className="contactLink">Are you releasing an album? Click here!</a>
                    <button className="scrollArrow" onClick={() => scrollToSection(archiveRef)}>
                        <img src="../../public/images/Arrow.svg" alt="" className="arrowImage" />
                    </button>
                </section>
            </section>
            <section className="archive" ref={archiveRef}>
                <section className="topBar">
                    <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                    <h1 className="pageHeader">THE ARCHIVE</h1>
                </section>

                <section className="gridHolder">
                    <ArchiveEntry type='year' month='2026' position='start' />
                    <ArchiveEntry type='month' month='March' position='' />
                    <section className="archiveGrid">
                        <div className="spine">
                            <div className="circle"></div>
                        </div>

                        <div className="archiveMonth">October - </div>
                        <section className="archiveAlbums">
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>

                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                        </section>
                    </section>
                    <section className="archiveGrid">
                        <div className="spine">
                            <div className="circle"></div>
                        </div>

                        <div className="archiveMonth">October - </div>
                        <section className="archiveAlbums">
                            <div className="albumBox"></div>
                        </section>
                    </section>
                    <section className="archiveGrid">
                        <div className="spine">
                            <div className="circle"></div>
                        </div>

                        <div className="archiveMonth">February - </div>
                        <section className="archiveAlbums">
                            <div className="albumBox"></div>
                        </section>
                    </section>
                    <section className="archiveGrid">
                        <div className="spine">
                            <div className="circle"></div>
                        </div>

                        <div className="archiveMonth">September - </div>
                        <section className="archiveAlbums">
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                            <div className="albumBox"></div>
                        </section>
                    </section>
                </section>
                <ArchiveEntry type='year' month='2025' position='end' />


            </section>
            <Footer />
        </section>

    );
}

export default Main;