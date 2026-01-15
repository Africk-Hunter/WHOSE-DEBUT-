import { useRef } from 'react';
import Album from '../components/Album'

function Main() {
    const whoseDebutRef = useRef<HTMLElement>(null);
    const stillFreshRef = useRef<HTMLElement>(null);
    const archiveRef = useRef<HTMLElement>(null);

    const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <>
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
                {/* <div className="divider"></div> */}
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
            <section className="archive"  ref={archiveRef}>
                <section className="topBar">
                    <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                    <h1 className="pageHeader">THE ARCHIVE</h1>
                </section>

                <section className="gridHolder">
                    <section className="archiveGrid year start">
                        <div className="spine">
                            <div className="circle"></div>
                        </div>

                        <div className="archiveMonth">2026</div>

                    </section>
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
                <section className="archiveGrid year end">
                    <div className="spine">
                        <div className="circle"></div>
                    </div>

                    <div className="archiveMonth">2025</div>

                </section>


            </section>
        </>

    );
}

export default Main;