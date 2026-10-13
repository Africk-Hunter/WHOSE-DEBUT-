import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/database/firebaseAuth';
import { fetchAllAlbumsFromFirebase, seedTestAlbums } from '../utilities/database/firebaseInteractions';
import { seedGenresIfEmpty } from '../utilities/database/genreInteractions';
import { GenreEntry, SEED_GENRES } from '../utilities/genres';
import { Album } from '../utilities/types';
import { sortAlbumsNewestFirst } from '../utilities/albumSorting';
import LoadingScreen from '../components/LoadingScreen';
import AddAlbumTab from '../components/admin/AddAlbumTab';
import ManageAlbumsTab from '../components/admin/ManageAlbumsTab';
import SubmissionsTab from '../components/admin/SubmissionsTab';
import CommentsTab from '../components/admin/CommentsTab';
import PlaceholdersTab from '../components/admin/PlaceholdersTab';

type Tab = 'add' | 'manage' | 'submissions' | 'comments' | 'placeholders';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('add');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (!user) {
                navigate('/admin');
                return;
            }
            setAuthChecked(true);
        });
        return () => unsubscribe();
    }, [navigate]);

    // Shared across tabs: the genre list, and the album list used by Manage + Fan Notes.
    const [availableGenres, setAvailableGenres] = useState<GenreEntry[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [albumsLoading, setAlbumsLoading] = useState(false);
    const [albumsLoaded, setAlbumsLoaded] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        if (!authChecked) return;
        const initGenres = async () => {
            setAvailableGenres(await seedGenresIfEmpty(SEED_GENRES));
        };
        initGenres();
    }, [authChecked]);

    const loadAlbumsList = async () => {
        setAlbumsLoading(true);
        const fetched = await fetchAllAlbumsFromFirebase();
        setAlbums(sortAlbumsNewestFirst(fetched));
        setAlbumsLoading(false);
        setAlbumsLoaded(true);
    };

    useEffect(() => {
        if (!authChecked || albumsLoaded || (activeTab !== 'manage' && activeTab !== 'comments')) return;
        loadAlbumsList();
    }, [authChecked, activeTab, albumsLoaded]);

    // Manage/Comments tabs cache the album list — invalidate it so a newly
    // added or published album shows up next time either tab is opened.
    const invalidateAlbums = useCallback(() => setAlbumsLoaded(false), []);

    const handleGenreCreated = useCallback((entry: GenreEntry) => {
        setAvailableGenres(prev => (prev.some(g => g.slug === entry.slug) ? prev : [...prev, entry]));
    }, []);

    const handleGenreDeleted = useCallback((slug: string) => {
        setAvailableGenres(prev => prev.filter(g => g.slug !== slug));
    }, []);

    async function handleSeedAlbums() {
        if (!window.confirm('This will add 15 test albums to the live database. Continue?')) return;
        await seedTestAlbums();
        alert('15 test albums added successfully');
    }

    async function handleLogout() {
        await signOut(auth);
        navigate('/');
    }

    if (!authChecked) return <LoadingScreen />;

    const tabs: { id: Tab; label: string }[] = [
        { id: 'add', label: 'Add Album' },
        { id: 'manage', label: 'Manage Albums' },
        { id: 'submissions', label: pendingCount > 0 ? `Submissions (${pendingCount})` : 'Submissions' },
        { id: 'comments', label: 'Fan Notes' },
        { id: 'placeholders', label: 'Placeholders' },
    ];

    return (
        <div className="about adminPage">
            <section className="topBar">
                <button className="backArrow backArrow--visible" onClick={() => navigate('/')}>
                    <img src="/images/Arrow.svg" alt="Back to main site" className="arrowImage" />
                </button>
                <h1 className="pageHeader pageHeader--about">ADMIN</h1>
            </section>
            <div className="divider"></div>

            <main className="adminContent">
                <div className="adminToolbar">
                    <nav className="adminTabs" aria-label="Admin sections">
                        {tabs.map(tab => (
                            <button
                                type="button"
                                key={tab.id}
                                className={`adminTab ${activeTab === tab.id ? 'adminTab--active' : ''}`}
                                aria-pressed={activeTab === tab.id}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                    <div className="adminActions">
                        <button type="button" onClick={handleSeedAlbums} className="adminButton adminButton--ghost">
                            Seed Test Albums
                        </button>
                        <button type="button" onClick={handleLogout} className="adminButton">
                            Logout
                        </button>
                    </div>
                </div>

                {/* Tabs stay mounted (hidden) so in-progress forms survive switching tabs. */}
                <div hidden={activeTab !== 'add'}>
                    <AddAlbumTab
                        availableGenres={availableGenres}
                        onGenreCreated={handleGenreCreated}
                        onGenreDeleted={handleGenreDeleted}
                        onAlbumAdded={invalidateAlbums}
                    />
                </div>
                <div hidden={activeTab !== 'manage'}>
                    <ManageAlbumsTab
                        albums={albums}
                        setAlbums={setAlbums}
                        albumsLoading={albumsLoading}
                        onRefresh={loadAlbumsList}
                        availableGenres={availableGenres}
                        onGenreCreated={handleGenreCreated}
                    />
                </div>
                <div hidden={activeTab !== 'submissions'}>
                    <SubmissionsTab
                        active={authChecked && activeTab === 'submissions'}
                        availableGenres={availableGenres}
                        onGenreCreated={handleGenreCreated}
                        onAlbumPublished={invalidateAlbums}
                        onPendingCountChange={setPendingCount}
                    />
                </div>
                <div hidden={activeTab !== 'comments'}>
                    <CommentsTab albums={albums} setAlbums={setAlbums} albumsLoading={albumsLoading} />
                </div>
                <div hidden={activeTab !== 'placeholders'}>
                    <PlaceholdersTab active={activeTab === 'placeholders'} />
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;
