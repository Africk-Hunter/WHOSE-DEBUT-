import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pullAlbumInfoByID } from '../utilities/localStorageHandling';

const AlbumView: React.FC = () => {
    const navigate = useNavigate();
    const [album, setAlbum] = useState<any>(null);

    function init() {
        const ID = localStorage.getItem('selectedID') ?? '0'
        const albumData = pullAlbumInfoByID(ID)
        setAlbum(albumData)
        console.log(ID)
        console.log(albumData)
    }

    useEffect(() => {
        init();
    }, [])

    if (!album) {
        return <div>Loading...</div>;
    }

    return (
        <main className="albumView" >
            <button className="back" onClick={() => navigate('/')}><img src="../../public/images/Arrow.svg" alt="Return" /></button>
            <section className="albumInfo">
                <img src={album.image_url} alt="" className="cover" />
                <section className="middleInfo">
                    <div className="nameAndArtist">
                        <h1 className="albumTitleView">{album.name}</h1>
                        <h2 className="albumArtistView">{album.artist}</h2>
                    </div>
                    <section className="links">
                        <a href={album.spotify} target='_blank' className="link"><img src="../../public/images/spotify.png" alt="Listen on Spotify" className="linkImg" /></a>
                        <a href={album.apple} target='_blank' className="link"><img src="../../public/images/AppleMusic.png" alt="Listen on Apple Music" className="linkImg" /></a>
                        <a href={album.bandcamp} target='_blank' className="link"><img src="../../public/images/bandcamp.png" alt="Listen on Bandcamp" className="linkImg" /></a>
                        <a href={album.amazon} target='_blank' className="link"><img src="../../public/images/amazon.svg" alt="Listen on Amazon Music" className="linkImg" /></a>
                    </section>
                    
                </section>
                <p className="genres">Genres: {album.genres}</p>
            </section>
            <section className="albumReviews">
                <div className="artistPitch">
                    <h2 className="label">Artist's Pitch:</h2>
                    <p className="review">{album.artist_review}</p>
                </div>
                <div className="peerReivew">
                    <h2 className="label">From a Peer:</h2>
                    <p className="review">{album.from_a_peer}</p>
                </div>
            </section>
        </main >
    );
};

export default AlbumView;
