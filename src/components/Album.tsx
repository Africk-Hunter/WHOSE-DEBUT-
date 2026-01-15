import React from 'react';

interface AlbumProps{
    type: string | null;
}

const Album: React.FC<AlbumProps> = ({type}) => {
    return (
        <div className={`album ${type === 'stillFresh' ? 'album--small' : ''}`}>
            <div className="albumImgHolder">
                <img src="" alt="" className="albumImage" />
            </div>
            <div className="textHolder">
                <h2 className="albumTitle">1984</h2>
                <h3 className="artistName">Van Halen</h3>
            </div>
        </div>
    );
};

export default Album;