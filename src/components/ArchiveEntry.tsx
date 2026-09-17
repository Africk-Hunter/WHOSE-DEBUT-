import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ArchiveEntryProps {
    type: string | null;
    position: string | null;
    month: string | null;
    albums: any;
    count?: number;
}

const ArchiveEntry: React.FC<ArchiveEntryProps> = ({ type, position, month, albums, count }) => {

    const navigate = useNavigate();

    function viewAlbum(id: string) {
        localStorage.setItem('selectedID', id)
        navigate(`/album/${id}`);
    }

    return (
        <section className={`archiveGrid ${type || ''} ${position || ''}`}>
            <div className="spine">
                <div className="circle"></div>
            </div>

            <div className="archiveMonth">{month}</div>

            {type == 'year' ? (
                position !== 'end' && (
                    <>
                        <div className="yearRule"></div>
                        {count != null && <span className="yearCount">{count} {count === 1 ? 'DEBUT' : 'DEBUTS'}</span>}
                    </>
                )
            ) :
                <section className="archiveAlbums">

                    {albums.map((album: any) => (
                        <div className="albumBox" key={album.id}>
                            <img src={album.image_url} alt={`${album.name} by ${album.artist}`} className="cover" onClick={() => viewAlbum(album.id)} />
                            <h2 className="archiveTitle">{album.name}</h2>
                            <h3 className="archiveArtist">{album.artist}</h3>
                        </div>
                    ))}
                </section>
            }
        </section>
    );
};

export default ArchiveEntry;