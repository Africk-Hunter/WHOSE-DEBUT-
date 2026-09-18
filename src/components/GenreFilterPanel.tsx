import React, { useEffect, useRef, useState } from 'react';
import { GenreOption, GenreSlug } from '../utilities/genres';

interface GenreFilterPanelProps {
    open: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement>;
    available: GenreOption[];
    labels: Record<string, string>;
    selected: GenreSlug[];
    onCommit: (next: GenreSlug[]) => void;
    onClear: () => void;
    countForSelection: (slugs: GenreSlug[]) => number;
}

const GenreFilterPanel: React.FC<GenreFilterPanelProps> = ({
    open,
    onClose,
    anchorRef,
    available,
    labels,
    selected,
    onCommit,
    onClear,
    countForSelection,
}) => {
    const [draft, setDraft] = useState<GenreSlug[]>(selected);
    const [search, setSearch] = useState('');
    const panelRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    useEffect(() => {
        if (!open) return;
        setDraft(selectedRef.current);
        setSearch('');
        requestAnimationFrame(() => {
            panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
        });
    }, [open]);

    if (!open) return null;

    const close = () => {
        anchorRef?.current?.focus();
        onClose();
    };

    const toggleDraft = (slug: GenreSlug) => {
        setDraft(prev => (prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            e.stopPropagation();
            close();
            return;
        }
        if (e.key !== 'Tab') return;
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
            'button, input, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const list = Array.from(focusables);
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    };

    const visible = available.length > 12
        ? available.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()))
        : available;

    const draftCount = countForSelection(draft);

    return (
        <>
            <div className="genreFilterScrim" onClick={close} />
            <div
                className="genreFilterPanel"
                role="dialog"
                aria-modal="true"
                aria-label="Filter by genre"
                ref={panelRef}
                onKeyDown={handleKeyDown}
            >
                <div className="genreFilterPanelHeader">
                    <h2>Filter by genre</h2>
                    <span className="genreFilterPanelSelectedCount">{draft.length} selected</span>
                </div>

                {available.length > 12 && (
                    <input
                        type="text"
                        className="genreFilterSearch"
                        placeholder="Search genres"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                )}

                <div className="genreFilterList">
                    {visible.map(opt => {
                        const isSelected = draft.includes(opt.slug);
                        return (
                            <button
                                type="button"
                                key={opt.slug}
                                role="checkbox"
                                aria-checked={isSelected}
                                className={`genreChip ${isSelected ? 'genreChip--active' : ''}`}
                                onClick={() => toggleDraft(opt.slug)}
                            >
                                {opt.label} <span className="genreChipCount">{opt.count}</span>
                            </button>
                        );
                    })}
                    {draft.filter(slug => !available.some(opt => opt.slug === slug)).map(slug => (
                        <button
                            type="button"
                            key={slug}
                            role="checkbox"
                            aria-checked={true}
                            className="genreChip genreChip--active"
                            onClick={() => toggleDraft(slug)}
                        >
                            {labels[slug] ?? slug}
                        </button>
                    ))}
                </div>

                <div className="genreFilterPanelFooter">
                    <button
                        type="button"
                        className="genreFilterClearButton"
                        onClick={() => setDraft([])}
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        className="genreFilterCommitButton"
                        onClick={() => (draft.length ? onCommit(draft) : onClear())}
                    >
                        {draft.length ? `Show ${draftCount} albums` : 'Show all albums'}
                    </button>
                </div>
            </div>
        </>
    );
};

export default GenreFilterPanel;
