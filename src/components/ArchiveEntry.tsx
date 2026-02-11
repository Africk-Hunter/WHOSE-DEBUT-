import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ArchiveEntryProps {
    type: string | null;
    position: string | null;
    month: string | null;
    albums: any;
}

const ArchiveEntry: React.FC<ArchiveEntryProps> = ({ type, position, month, albums }) => {

    const navigate = useNavigate();

    function viewAlbum(id) {
        localStorage.setItem('selectedID', id)
        navigate(`/album/${id}`);
    }

    return (
        <section className={`archiveGrid ${type || ''} ${position || ''}`}>
            <div className="spine">
                <div className="circle"></div>
            </div>

            <div className="archiveMonth">{month}</div>

            {type == 'year' ? <></> :
                <section className="archiveAlbums">

                    {albums.map((album: any) => (
                        <>
                            <div className="albumBox">
                                <img src={album.image_url} alt="" className="cover" onClick={() => viewAlbum(album.id)} />
                                <h2 className="archiveTitle">{album.name}</h2>
                            </div>
                            
                        </>

                    ))}
                </section>
            }
        </section>
    );
};

export default ArchiveEntry;