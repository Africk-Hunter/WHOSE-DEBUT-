import React from 'react';

interface AlbumProps{
    type: string | null;
    title: string;
    artist: string;
    release_date?: string;
    genres?: string[];
    review?: string;
    fromAPeer?: string;
    engineers?: string[];
    producers?: string[];
    writers?: string[];
    image?: any;
}

const Album: React.FC<AlbumProps> = ({type, title, artist, release_date, genres, review, fromAPeer, engineers, producers, writers, image}) => {
    return (
        <div className={`album ${type === 'stillFresh' ? 'album--small' : ''}`}>
            <div className="albumImgHolder">
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