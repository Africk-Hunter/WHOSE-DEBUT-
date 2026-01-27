import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utilities/database/supabaseClient';
import { uploadCoverToSupabase, submitAlbumToSupabase } from '../utilities/database/supabaseInteractions';

const AdminDashboard: React.FC = () => {
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
        description: '',
        fromapeer: '',
        written_by: '',
        produced_by: '',
        engineered_by: ''
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setAlbumData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input changed:', e.target.files);
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            console.log('File selected:', file.name, file.size, file.type);
            setImageFile(file);
        } else {
            console.log('No file selected');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Album Data:', albumData);
        console.log('Image File:', imageFile);

        let imageUrl = '';

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${albumData.artist.replace(/\s+/g, '_')}-${albumData.title.replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`;
            console.log('Uploading file:', fileName);

            imageUrl = await uploadCoverToSupabase(fileName, imageFile);
        }

        if (await submitAlbumToSupabase(albumData, imageUrl)) {
            setAlbumData({
                title: '',
                artist: '',
                releaseDate: '',
                genre: '',
                description: '',
                fromapeer: '',
                written_by: '',
                produced_by: '',
                engineered_by: ''
            });
            setImageFile(null);
        }
    };

    async function handleLogout() {
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
                        <input type="text" id="title" name="title" value={albumData.title} onChange={handleInputChange} required />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="artist">Artist Name</label>
                        <input type="text" id="artist" name="artist" value={albumData.artist} onChange={handleInputChange} required />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="releaseDate">Release Date</label>
                        <input type="date" id="releaseDate" name="releaseDate" value={albumData.releaseDate} onChange={handleInputChange} required />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="genre">Genre</label>
                        <input type="text" id="genre" name="genre" value={albumData.genre} onChange={handleInputChange} />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="imageFile">Album Cover Image</label>
                        <input type="file" id="imageFile" name="imageFile" accept="image/*" onChange={handleFileChange} />
                    </div>

                    <div className="formGroup">
                        <label htmlFor="description">Artist Review</label>
                        <textarea id="description" name="description" value={albumData.description} onChange={handleInputChange} rows={4} />
                    </div>
                    <div className="formGroup">
                        <div className="formGroup">
                            <label htmlFor="fromapeer">From a Peer</label>
                            <textarea id="fromapeer" name="fromapeer" value={albumData.fromapeer} onChange={handleInputChange} rows={4} />
                        </div>
                        <label htmlFor="written_by">Written By</label>
                        <textarea id="written_by" name="written_by" value={albumData.written_by} onChange={handleInputChange} rows={1} />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="produced_by">Produced By</label>
                        <textarea id="produced_by" name="produced_by" value={albumData.produced_by} onChange={handleInputChange} rows={1} />
                    </div>
                    <div className="formGroup">
                        <label htmlFor="engineered_by">Engineered By</label>
                        <textarea id="engineered_by" name="engineered_by" value={albumData.engineered_by} onChange={handleInputChange} rows={1} />
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
