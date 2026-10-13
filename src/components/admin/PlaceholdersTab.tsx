import React, { useEffect, useState } from 'react';
import { uploadCoverToCloudinary } from '../../utilities/database/firebaseInteractions';
import {
    fetchPlaceholderSettings,
    savePlaceholderSettings,
    PlaceholderSettings,
    DEFAULT_PLACEHOLDER_SETTINGS,
} from '../../utilities/database/placeholderSettings';
import { optimizeCloudinaryUrl } from '../../utilities/cloudinary';
import { useObjectUrl } from '../../hooks/useObjectUrl';

interface PlaceholdersTabProps {
    active: boolean;
}

const PlaceholdersTab: React.FC<PlaceholdersTabProps> = ({ active }) => {
    const [settings, setSettings] = useState<PlaceholderSettings>(DEFAULT_PLACEHOLDER_SETTINGS);
    const [loaded, setLoaded] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const imagePreviewUrl = useObjectUrl(imageFile);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!active || loaded) return;
        const load = async () => {
            setSettings(await fetchPlaceholderSettings());
            setLoaded(true);
        };
        load();
    }, [active, loaded]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        let imageUrl = settings.image_url;
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `placeholder-cover-${Date.now()}.${fileExt}`;
            imageUrl = await uploadCoverToCloudinary(fileName, imageFile);
        }

        const updated: PlaceholderSettings = { ...settings, image_url: imageUrl };
        setIsSaving(true);
        const success = await savePlaceholderSettings(updated);
        setIsSaving(false);

        if (success) {
            setSettings(updated);
            setImageFile(null);
            alert('Placeholder settings saved');
        }
    };

    return (
        <section className="adminPanel">
            <h2>Placeholder Albums</h2>
            <p className="formHint">
                When there aren&rsquo;t enough real albums to fill the home page (Top 3 + Still Fresh,
                13 cards total), these fill the empty slots so visitors can see what a full page looks
                like. They&rsquo;re never clickable and never show up in the Archive.
            </p>
            {!loaded ? (
                <p className="formHint">Loading&hellip;</p>
            ) : (
                <form onSubmit={handleSave} className="albumForm">
                    <div className="formSection">
                        <label className="adminCheckbox">
                            <input
                                type="checkbox"
                                checked={settings.enabled}
                                onChange={e => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                            />
                            Show placeholder albums
                        </label>
                        <div className="formGroup">
                            <label htmlFor="placeholderCount">How many (0&ndash;13)</label>
                            <input
                                type="number"
                                id="placeholderCount"
                                min={0}
                                max={13}
                                value={settings.count}
                                onChange={e =>
                                    setSettings(prev => ({
                                        ...prev,
                                        count: Math.max(0, Math.min(13, Number(e.target.value) || 0)),
                                    }))
                                }
                            />
                        </div>
                        <div className="formRow">
                            <div className="formGroup">
                                <label htmlFor="placeholderTitle">Title</label>
                                <input
                                    type="text"
                                    id="placeholderTitle"
                                    value={settings.title}
                                    onChange={e => setSettings(prev => ({ ...prev, title: e.target.value }))}
                                />
                            </div>
                            <div className="formGroup">
                                <label htmlFor="placeholderArtist">Artist</label>
                                <input
                                    type="text"
                                    id="placeholderArtist"
                                    value={settings.artist}
                                    onChange={e => setSettings(prev => ({ ...prev, artist: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="formGroup">
                            <label htmlFor="placeholderImage">Cover Image</label>
                            <input
                                type="file"
                                id="placeholderImage"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {(imagePreviewUrl || settings.image_url) && (
                                <img
                                    src={imagePreviewUrl || optimizeCloudinaryUrl(settings.image_url, 320)}
                                    alt="Placeholder cover preview"
                                    className="coverPreview"
                                />
                            )}
                        </div>
                    </div>
                    <div className="submitRow">
                        <button type="submit" className="adminButton adminButton--primary" disabled={isSaving}>
                            {isSaving ? 'Saving…' : 'Save Placeholder Settings'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
};

export default PlaceholdersTab;
