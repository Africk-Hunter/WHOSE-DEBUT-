import React, { useEffect, useState } from 'react';
import ArchiveEntry from './ArchiveEntry';
import { getParsedLocalStorage } from '../utilities/localStorageHandling';

interface ArchiveProps { }


const Archive: React.FC<ArchiveProps> = ({ }) => {
    const [albums, setAlbums] = useState<any[]>([]);
    const [albumYears, setAlbumYears] = useState<Number[]>([])

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

    function getAlbumYear(album) {
        const year = album.year_released.slice(0, 4)
        return year;
    }

    function getAlbumMonth(album) {
        const monthDate = parseInt(album.year_released.slice(5, 7))
        const monthName = month[monthDate - 1]
        return monthName;
    }

    function getPositionType(index: number) {
        if (index == 0) {
            return 'start'
        }
        if (index == albums.length) {
            return 'start'
        }
        return '';

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

        return elements;
    }

    function renderAlbumEntry(album: any, index: number) {
        const albumYear = getAlbumYear(album);
        const prevAlbumYear = index > 0 ? getAlbumYear(albums[index - 1]) : null;
        const showYearSeparator = albumYear !== prevAlbumYear;



        return (
            <React.Fragment key={index}>
                {showYearSeparator && (
                    <ArchiveEntry type='year' month={albumYear} position={getPositionType(index)} albums={[]} />
                )}
                <ArchiveEntry type='month' month={getAlbumMonth(album)} position='' albums={[]} />
            </React.Fragment>
        );
    }


    return (
        <section className="archive" >
            <section className="topBar">
                <button className="backArrow"><img src="../../public/images/Arrow.svg" alt="" className="arrowImage" /></button>
                <h1 className="pageHeader">THE ARCHIVE</h1>
            </section>

            <section className="gridHolder">
                {displayAlbums()}
            </section>
            <ArchiveEntry type='year' month='' position='end' albums={[]} />


        </section>
    );
};

export default Archive;