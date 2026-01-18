import { useRef, useEffect, useState } from 'react';
import Album from '../components/Album'
import Footer from '../components/Footer'
import ArchiveEntry from '../components/ArchiveEntry';
import { loadAlbumsFromDatabase } from '../components/AlbumHandler';

function Main() {
    const whoseDebutRef = useRef<HTMLElement>(null);
    const stillFreshRef = useRef<HTMLElement>(null);
    const archiveRef = useRef<HTMLElement>(null);
    const [inArchive, setInArchive] = useState(false);



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

    useEffect( ()=> {
        loadAlbumsFromDatabase();
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
                    <Album type={null} />
                    <Album type={null} />
                    <Album type={null} />
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
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
                    <Album type='stillFresh' />
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