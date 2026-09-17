import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pullAlbumInfoByID } from '../utilities/localStorageHandling';
import LoadingScreen from '../components/LoadingScreen';

const services = [
    { key: 'spotify', href: 'spotify', label: 'Spotify', icon: '/images/Spotify.png' },
    { key: 'apple', href: 'apple', label: 'Apple', icon: '/images/AppleMusic.png' },
    { key: 'bandcamp', href: 'bandcamp', label: 'Bandcamp', icon: '/images/Bandcamp.png' },
    { key: 'amazon', href: 'amazon', label: 'Amazon', icon: '/images/Amazon.svg' },
];

interface AlbumViewProps {
    albumId?: string;
}

const AlbumView: React.FC<AlbumViewProps> = ({ albumId }) => {
    const navigate = useNavigate();
    const [album, setAlbum] = useState<any>(null);

    useEffect(() => {
        const ID = albumId ?? localStorage.getItem('selectedID') ?? '0';
        setAlbum(pullAlbumInfoByID(ID));
    }, [albumId]);

    if (!album) return <LoadingScreen />;

    return (
        <main className="albumView">
            <div className="albumTopRow">
                <button className="back" onClick={() => navigate(-1)}><img src="/images/Arrow.svg" alt="Return" /></button>
                <span className="albumBreadcrumb">WHOSE DEBUT?</span>
            </div>
            <section className="albumInfo">
                <img src={album.image_url} alt={`${album.name} by ${album.artist}`} className="cover" />
                <div className="infoSection">
                    <div className="leftInfo">
                        <div className="nameAndArtist">
                            <h1 className="albumTitleView">{album.name}</h1>
                            <h2 className="albumArtistView">{album.artist}</h2>
                        </div>
                        <ul className="genres">
                            {String(album.genres ?? '').split(',').map(g => g.trim()).filter(Boolean).map(g => (
                                <li key={g}>{g}</li>
                            ))}
                        </ul>
                    </div>
                    <span className="listenLabel">Listen</span>
                    <section className="links">
                        {services.filter(s => album[s.href]).map(s => (
                            <a key={s.key} href={album[s.href]} target="_blank" rel="noopener noreferrer" className="link">
                                <img src={s.icon} alt={`Listen on ${s.label}`} className="linkImg" />
                                <span>{s.label}</span>
                            </a>
                        ))}
                    </section>
                </div>
            </section>
            <section className="albumReviews">
                <div className="artistPitch">
                    <h2 className="label">Artist's Pitch:</h2>
                    <p className="review">{album.artist_review}</p>
                </div>
                {album.from_a_peer && (
                    <div className="peerReivew">
                        <h2 className="label">From a Peer:</h2>
                        <p className="review">{album.from_a_peer}</p>
                    </div>
                )}
            </section>
            <a href="/about" className="albumViewCTA">Are you releasing an album? Click here!</a>
        </main>
    );
};

export default AlbumView;
