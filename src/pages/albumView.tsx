import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pullAlbumInfoByID } from '../utilities/localStorageHandling';

const AlbumView: React.FC = () => {
    const navigate = useNavigate();
    const [album, setAlbum] = useState<any>(null);

    function init() {
        const currentLink = window.location.href
        const ID = currentLink[currentLink.length - 1]
        const albumData = pullAlbumInfoByID(ID)
        setAlbum(albumData)
        console.log(albumData)
    }

    useEffect(() => {
        init();
    }, [])

    if (!album) {
        return <div>Loading...</div>;
    }

    return (
        < main className="albumView" >
            <button className="back"><img src="public/images/Arrow.svg" alt="" className="backImg" /></button>
            <section className="albumInfo">
                <img src={album.image_url} alt="" className="cover" />
                <section className="middleInfo">
                    <div className="nameAndArtist">
                        <h1 className="albumTitle">{album.name}</h1>
                        <h2 className="albumArtist">{album.artist}</h2>
                    </div>
                    <section className="links">
                        <a href={album.spotify} className="link"><img src="" alt="" className="linkImg" /></a>
                        <a href={album.apple} className="link"><img src="" alt="" className="linkImg" /></a>
                        <a href={album.bandcamp} className="link"><img src="" alt="" className="linkImg" /></a>
                        <a href={album.amazon} className="link"><img src="" alt="" className="linkImg" /></a>
                    </section>
                    <p className="genres"></p>
                </section>
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
