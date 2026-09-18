import React from 'react';
import { Album } from '../utilities/types';

interface ArchiveEntryProps {
    kind: 'year' | 'month';
    label: string;
    position?: string;
    matched?: number;
    total?: number;
    albums?: Album[];
    empty?: boolean;
    emptyLabel?: string;
    onSelectAlbum?: (id: string) => void;
}

const ArchiveEntry: React.FC<ArchiveEntryProps> = ({
    kind,
    label,
    position = '',
    matched,
    total,
    albums = [],
    empty = false,
    emptyLabel,
    onSelectAlbum,
}) => {
    if (kind === 'year') {
        return (
            <section className={`archiveGrid year ${position}`}>
                <div className="spine">
                    <div className="circle"></div>
                </div>
                <div className="archiveMonth">{label}</div>
                {position !== 'end' && (
                    <>
                        <div className="yearRule"></div>
                        {total != null && (
                            <span className="yearCount">
                                {matched != null && matched !== total ? `${matched} of ${total}` : total}{' '}
                                {total === 1 ? 'DEBUT' : 'DEBUTS'}
                            </span>
                        )}
                    </>
                )}
            </section>
        );
    }

    return (
        <section className={`archiveGrid ${empty ? 'archiveGrid--empty' : ''}`}>
            <div className="spine">
                <div className={`circle ${empty ? 'circle--empty' : ''}`}></div>
            </div>
            {empty ? (
                <div className="archiveMonth archiveMonth--empty">{label} &middot; {emptyLabel}</div>
            ) : (
                <>
                    <div className="archiveMonth">{label}</div>
                    <section className="archiveAlbums">
                        {albums.map(album => (
                            <div className="albumBox" key={album.id}>
                                <img
                                    src={album.image_url}
                                    alt={`${album.name} by ${album.artist}`}
                                    className="cover"
                                    loading="lazy"
                                    decoding="async"
                                    onClick={() => onSelectAlbum?.(album.id)}
                                />
                                <h2 className="archiveTitle">{album.name}</h2>
                                <h3 className="archiveArtist">{album.artist}</h3>
                            </div>
                        ))}
                    </section>
                </>
            )}
        </section>
    );
};

export default ArchiveEntry;
