import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { pullAlbumInfoByID, getParsedGenres } from '../utilities/localStorageHandling';
import { formatReviewText } from '../utilities/textFormatting';
import { albumGenres } from '../utilities/genres';
import LoadingScreen from '../components/LoadingScreen';
import { optimizeCloudinaryUrl } from '../utilities/cloudinary';

function isSafeUrl(url: string): boolean {
    try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

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

    const genreLabels: Record<string, string> = Object.fromEntries(
        getParsedGenres().map((g: { slug: string; label: string }) => [g.slug, g.label])
    );

    return (
        <main className="albumView">
            <div className="albumTopRow">
                <button className="back" onClick={() => navigate(-1)}><img src="/images/Arrow.svg" alt="Return" /></button>
                <span className="albumBreadcrumb">WHOSE DEBUT?</span>
            </div>
            <section className="albumInfo">
                <img src={optimizeCloudinaryUrl(album.image_url, 800)} alt={`${album.name} by ${album.artist}`} className="cover" decoding="async" />
                <div className="infoSection">
                    <div className="leftInfo">
                        <div className="nameAndArtist">
                            <h1 className="albumTitleView">{album.name}</h1>
                            <h2 className="albumArtistView">{album.artist}</h2>
                        </div>
                        <ul className="genres">
                            {albumGenres(album).map(slug => (
                                <li key={slug}>
                                    <Link to={`/?genre=${slug}#archive`} state={{ fromGenreChip: true }}>{genreLabels[slug] ?? slug}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <span className="listenLabel">Listen</span>
                    <section className="links">
                        {services.filter(s => album[s.href] && isSafeUrl(album[s.href])).map(s => (
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
                    <p className="review" dangerouslySetInnerHTML={{ __html: formatReviewText(album.artist_review ?? '') }} />
                </div>
                {album.from_a_peer && (
                    <div className="fanReview">
                        <h2 className="label">From a Fan:</h2>
                        <p className="review" dangerouslySetInnerHTML={{ __html: formatReviewText(album.from_a_peer) }} />
                    </div>
                )}
            </section>
            <a href="/about" className="albumViewCTA">Are you releasing an album? Click here!</a>
        </main>
    );
};

export default AlbumView;
