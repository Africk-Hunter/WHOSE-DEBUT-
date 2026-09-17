import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AlbumProps {
    type: string | null;
    title: string;
    artist: string;
    image: string;
    id: string;
    rank?: number;
}


const Album: React.FC<AlbumProps> = ({ type, title, artist, image, id, rank }) => {
    const navigate = useNavigate();

    function viewAlbum() {
        localStorage.setItem('selectedID', id)
        navigate(`/album/${id}`);
    }

    return (
        <div className={`album ${type === 'stillFresh' ? 'album--small' : ''}`} onClick={viewAlbum}>
            <div className="albumImgHolder">
                {rank != null && <span className="rankBadge">{String(rank).padStart(2, '0')}</span>}
                <img src={image} alt={title} className="albumImage" />
            </div>
            <div className="textHolder">
                <h2 className="albumTitle">{title}</h2>
                <h3 className="artistName">{artist}</h3>
            </div>
        </div>
    );
};

export default Album;