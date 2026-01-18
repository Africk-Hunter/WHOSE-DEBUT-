import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utilities/database/supabaseClient';

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState('users');
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/admin');
            }
        };
        checkAuth();
    }, [navigate]);

    const [albumData, setAlbumData] = useState({
        title: '',
        artist: '',
        releaseDate: '',
        genre: '',
        imageUrl: '',
        description: '',
        fromapeer: '',
        written_by: '',
        produced_by: '',
        engineered_by: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAlbumData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Album Data:', albumData);
    };

    async function handleLogout(){  
        await supabase.auth.signOut()
        navigate('/');
    };

    return (
        <div className="adminDash">
            <h1 className="panelLabel">Admin Panel</h1>
            <section className="albumAdd">
                <h2>Add New Album</h2>
                <form onSubmit={handleSubmit} className="albumForm">
                    <div className="formGroup">
                        <label htmlFor="title">Album Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={albumData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="artist">Artist Name</label>
                        <input
                            type="text"
                            id="artist"
                            name="artist"
                            value={albumData.artist}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="releaseDate">Release Date</label>
                        <input
                            type="date"
                            id="releaseDate"
                            name="releaseDate"
                            value={albumData.releaseDate}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="genre">Genre</label>
                        <input
                            type="text"
                            id="genre"
                            name="genre"
                            value={albumData.genre}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="imageUrl">Image URL</label>
                        <input
                            type="file"
                            id="imageUrl"
                            name="imageUrl"
                            value={albumData.imageUrl}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="description">Artist Review</label>
                        <textarea
                            id="description"
                            name="description"
                            value={albumData.description}
                            onChange={handleInputChange}
                            rows={4}
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="written_by">Written By</label>
                        <textarea
                            id="written_by"
                            name="written_by"
                            value={albumData.written_by}
                            onChange={handleInputChange}
                            rows={4}
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="produced_by">Produced By</label>
                        <textarea
                            id="produced_by"
                            name="produced_by"
                            value={albumData.produced_by}
                            onChange={handleInputChange}
                            rows={1}
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="engineered_by">Engineered By</label>
                        <textarea
                            id="engineered_by"
                            name="engineered_by"
                            value={albumData.engineered_by}
                            onChange={handleInputChange}
                            rows={1}
                        />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="fromapeer">From a Peer</label>
                        <textarea
                            id="fromapeer"
                            name="fromapeer"
                            value={albumData.fromapeer}
                            onChange={handleInputChange}
                            rows={1}
                        />
                    </div>

                    <button type="submit" className="adminButton">Add Album</button>
                </form>
            </section>
            <button onClick={handleLogout} className="adminButton">
                Logout
            </button>
        </div>
    );
};

export default AdminDashboard;
