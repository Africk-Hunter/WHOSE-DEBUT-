import React from 'react';
import { useNavigate } from 'react-router-dom';
import Contact from '../components/Contact';

const About: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="about">
            <section className="topBar">
                <button className="backArrow backArrow--visible" onClick={() => navigate('/')}><img src="/images/Arrow.svg" alt="" className="arrowImage" /></button>
                <h1 className="pageHeader pageHeader--about">WHOSE DEBUT?</h1>
            </section>
            <div className="divider"></div>
            <main className="aboutContent">
                <div className="aboutText">
                    WHOSE DEBUT? is a platform for artists in the Reno area to share their new releases and connect with local fans. In a world where an over-saturated streaming market makes it nearly impossible to get noticed, WHOSE DEBUT? aims to tap into the potential exposure that the Reno community can provide.

                    <br></br><br></br>Want to get involved? Fill out the form fields and I’ll get in contact with you soon!

                    <div className="hunter">
                        - Hunter
                    </div>
                </div>

                <Contact />
                <a href="/" className="backToMain">Take me back to the main site</a>
            </main>
        </div>
    );
};

export default About;
