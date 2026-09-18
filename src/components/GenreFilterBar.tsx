import React, { useRef, useState } from 'react';
import { GenreOption, GenreSlug } from '../utilities/genres';
import GenreFilterPanel from './GenreFilterPanel';

interface GenreFilterBarProps {
    available: GenreOption[];
    labels: Record<string, string>;
    selected: GenreSlug[];
    toggle: (slug: GenreSlug) => void;
    clear: () => void;
    commit: (slugs: GenreSlug[]) => void;
    active: boolean;
    resultCount: number;
    resultNoun?: string;
    countForSelection: (slugs: GenreSlug[]) => number;
}

const GenreFilterBar: React.FC<GenreFilterBarProps> = ({
    available,
    labels,
    selected,
    toggle,
    clear,
    commit,
    active,
    resultCount,
    resultNoun = 'albums',
    countForSelection,
}) => {
    const [open, setOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);

    return (
        <div className="genreFilterBar">
            <div className="genreFilterRow">
                <button
                    type="button"
                    ref={buttonRef}
                    className={`genreFilterButton ${active ? 'genreFilterButton--active' : ''}`}
                    aria-expanded={open}
                    aria-haspopup="dialog"
                    onClick={() => setOpen(o => !o)}
                >
                    <span className="genreFilterIcon" aria-hidden="true" />
                    <span>Genre</span>
                    {active && <span className="genreFilterButtonCount">{selected.length}</span>}
                </button>

                {!active && available.slice(0, 3).map(opt => (
                    <button
                        key={opt.slug}
                        type="button"
                        className="genreChip"
                        onClick={() => toggle(opt.slug)}
                    >
                        {opt.label} <span className="genreChipCount">{opt.count}</span>
                    </button>
                ))}

                {active && selected.map(slug => (
                    <button
                        key={slug}
                        type="button"
                        className="genreChip genreChip--active"
                        onClick={() => toggle(slug)}
                    >
                        {labels[slug] ?? slug} <span className="genreChipRemove">&times;</span>
                    </button>
                ))}

                {active && (
                    <button type="button" className="genreClearAll" onClick={clear}>
                        Clear all
                    </button>
                )}

                <span className="genreResultCount">
                    {resultCount} {resultNoun}
                </span>
            </div>

            <GenreFilterPanel
                open={open}
                onClose={() => setOpen(false)}
                anchorRef={buttonRef}
                available={available}
                labels={labels}
                selected={selected}
                onCommit={next => { commit(next); setOpen(false); }}
                onClear={() => { clear(); setOpen(false); }}
                countForSelection={countForSelection}
            />
        </div>
    );
};

export default GenreFilterBar;
