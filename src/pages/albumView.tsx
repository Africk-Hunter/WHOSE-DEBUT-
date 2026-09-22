import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { pullAlbumInfoByID, getParsedGenres } from '../utilities/localStorageHandling';
import { formatReviewText } from '../utilities/textFormatting';
import { albumGenres } from '../utilities/genres';
import LoadingScreen from '../components/LoadingScreen';
import { optimizeCloudinaryUrl } from '../utilities/cloudinary';
import FanNoteForm from '../components/FanNoteForm';
import PreviewAudioPlayer from '../components/PreviewAudioPlayer';
import type { Album } from '../utilities/types';

function isSafeUrl(url: string): boolean {
    try {
        return ['http:', 'https:'].includes(new URL(url).protocol);
    } catch {
        return false;
    }
}

type StreamingLinkField = 'spotify' | 'apple' | 'bandcamp' | 'amazon';

const services: { key: StreamingLinkField; href: StreamingLinkField; label: string; icon: string }[] = [
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
    const [album, setAlbum] = useState<Album | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const ID = albumId ?? localStorage.getItem('selectedID') ?? '0';
        const found = pullAlbumInfoByID(ID);
        setAlbum(found);
        setNotFound(!found);
    }, [albumId]);

    if (notFound) {
        return (
            <div className="errorScreen">
                <p className="errorScreenText">This album isn't available anymore.</p>
                <Link to="/" className="errorScreenButton">Back to WHOSE DEBUT?</Link>
            </div>
        );
    }

    if (!album) return <LoadingScreen />;

    const genreLabels: Record<string, string> = Object.fromEntries(
        getParsedGenres().map((g: { slug: string; label: string }) => [g.slug, g.label])
    );

    return (
        <main className="albumView">
            <div className="albumTopRow">
                <button className="back" onClick={() => navigate(-1)}><img src="/images/Arrow.svg" alt="Return" /></button>
                <span className="albumBreadcrumb">WHOSE DEBUT?</span>
                <a href="/about" className="albumTopCTA">Are you releasing an album? Click here!</a>
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
                        {album.preview_audio_url && (
                            <div className="previewAudio">
                                <span className="previewAudioLabel">
                                    Preview{album.preview_song_name ? `: ${album.preview_song_name}` : ''}
                                </span>
                                <PreviewAudioPlayer src={album.preview_audio_url} />
                            </div>
                        )}
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
                <div className="fanReview">
                    <h2 className="label">Fan Notes:</h2>
                    {album.comments && album.comments.length > 0 ? (
                        <ul className="commentList">
                            {album.comments.map((comment: { id: string; name: string; text: string }) => (
                                <li key={comment.id} className="commentItem">
                                    <p className="commentText" dangerouslySetInnerHTML={{ __html: formatReviewText(comment.text) }} />
                                    <span className="commentAuthor">{comment.name}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="commentEmpty">No notes yet. Be the first to tell {album.artist} what you think!</p>
                    )}
                    <FanNoteForm albumId={album.id} albumName={album.name} artist={album.artist} compact />
                </div>
            </section>
            <div className="albumBottomGroup">
                <a href="/about" className="albumViewCTA">Are you releasing an album? Click here!</a>
            </div>
        </main>
    );
};

export default AlbumView;
