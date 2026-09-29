import React from 'react';
import { useNavigate } from 'react-router-dom';
import { optimizeCloudinaryUrl } from '../utilities/cloudinary';

interface AlbumProps {
    type: string | null;
    title: string;
    artist: string;
    image: string;
    id: string;
    rank?: number;
    genre?: string;
    isPlaceholder?: boolean;
}


const Album: React.FC<AlbumProps> = ({ type, title, artist, image, id, genre, isPlaceholder }) => {
    const navigate = useNavigate();

    function viewAlbum() {
        if (isPlaceholder) return;
        localStorage.setItem('selectedID', id)
        navigate(`/album/${id}`);
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            viewAlbum();
        }
    };

    return (
        <div
            className={`album ${type === 'stillFresh' ? 'album--small' : ''} ${isPlaceholder ? 'album--placeholder' : ''}`}
            onClick={viewAlbum}
            onKeyDown={isPlaceholder ? undefined : handleKeyDown}
            role={isPlaceholder ? undefined : 'button'}
            tabIndex={isPlaceholder ? undefined : 0}
        >
            <div className="albumImgHolder">
                {isPlaceholder ? (
                    <span className="placeholderBadge">Coming Soon</span>
                ) : (
                    genre && <span className="genreBadge">{genre}</span>
                )}
                {image && (
                    <img
                        src={optimizeCloudinaryUrl(image, type === 'stillFresh' ? 400 : 700)}
                        alt={title}
                        className="albumImage"
                        loading={type === 'stillFresh' ? 'lazy' : 'eager'}
                        decoding="async"
                    />
                )}
            </div>
            <div className="textHolder">
                <h2 className="albumTitle">{title}</h2>
                <h3 className="artistName">{artist}</h3>
            </div>
        </div>
    );
};

export default Album;