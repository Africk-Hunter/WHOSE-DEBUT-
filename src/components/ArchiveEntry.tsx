import React from 'react';

interface ArchiveEntryProps {
    type: string | null;
    position: string | null;
    month: string | null;
    
}

const ArchiveEntry: React.FC<ArchiveEntryProps> = ({ type, position, month }) => {
    return (
        <section className={`archiveGrid ${type || ''} ${position || ''}`}>
            <div className="spine">
                <div className="circle"></div>
            </div>

            <div className="archiveMonth">{month}</div>

        </section>
    );
};

export default ArchiveEntry;