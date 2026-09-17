import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ArchiveEntry from './ArchiveEntry';
import { getParsedLocalStorage } from '../utilities/localStorageHandling';

interface ArchiveProps { }


const Archive: React.FC<ArchiveProps> = ({ }) => {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState<any[]>([]);
    const [albumYears] = useState<Number[]>([])

    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    useEffect(() => {
        const init = () => {
            const parsed = getParsedLocalStorage()
            setAlbums(parsed || []);
            console.log("parsed albums: ", parsed);
            findYearsOfAllAlbums(parsed);
        };
        init();

    }, [])

    function getAlbumYear(album: any) {
        const year = album.year_released.slice(0, 4)
        return year;
    }

    function getAlbumMonth(album: any) {
        const monthDate = parseInt(album.year_released.slice(5, 7))
        const monthName = month[monthDate - 1]
        return monthName;
    }

    function isYearBeingTracked(year: number) {
        for (var i = 0; i < albumYears.length; i++) {
            if (year == albumYears[i]) {
                return true;
            }
        }

        return false;
    }

    function findYearsOfAllAlbums(albums: any) {
        for (var i = 0; i < albums.length; i++) {
            const year = getAlbumYear(albums[i])
            if (!isYearBeingTracked(year)) {
                albumYears.push(year);
            }
        }
        albumYears.sort((a, b) => Number(b) - Number(a))
    }

    function displayAlbums() {
        const elements: JSX.Element[] = [];

        // Loop through each year
        for (var i = 0; i < albumYears.length; i++) {
            var currentYear = albumYears[i];
            var currentYearAlbums: any[] = []

            // Loop through albums and collect those from current year
            for (var j = 0; j < albums.length; j++) {
                if (getAlbumYear(albums[j]) == currentYear) {
                    currentYearAlbums.push(albums[j])
                }
            }

            // Add year separator
            const position = i === 0 ? 'start' : '';
            elements.push(
                <ArchiveEntry
                    key={`year-${currentYear}`}
                    type='year'
                    month={String(currentYear)}
                    position={position}
                    albums={[]}
                    count={currentYearAlbums.length}
                />
            );

            // Loop through months
            for (var monthIndex = 0; monthIndex < 12; monthIndex++) {
                var albumsThisMonth = 0;
                var displayAlbums: any[] = [];

                // Loop through current year's albums
                for (var k = 0; k < currentYearAlbums.length; k++) {
                    if (getAlbumMonth(currentYearAlbums[k]) == month[monthIndex]) {
                        displayAlbums.push(currentYearAlbums[k]);
                        albumsThisMonth++;
                    }
                }

                // If albums exist for this month, render them
                if (albumsThisMonth > 0) {
                    elements.push(
                        <ArchiveEntry
                            key={`${currentYear}-${month[monthIndex]}`}
                            type='month'
                            month={month[monthIndex]}
                            position=''
                            albums={displayAlbums}
                        />
                    );
                }
            }
        }

        elements.push(
            <ArchiveEntry key="end" type='year' month='' position='end' albums={[]} />
        );

        return elements;
    }

    return (
        <section className="archive" >
            <section className="topBar">
                <button className="backArrow" onClick={() => navigate('/')}><img src="/images/Arrow.svg" alt="" className="arrowImage" /></button>
                <h1 className="pageHeader pageHeader--section">THE ARCHIVE</h1>
            </section>
            <div className="divider"></div>

            <section className="gridHolder">
                {displayAlbums()}
            </section>

        </section>
    );
};

export default Archive;