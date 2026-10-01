import { doc, getDoc, setDoc } from 'firebase/firestore/lite';
import { db } from './firebaseClient';
import { logError } from '../logger';

export interface PlaceholderSettings {
    enabled: boolean;
    count: number;
    title: string;
    artist: string;
    image_url: string;
}

export const DEFAULT_PLACEHOLDER_SETTINGS: PlaceholderSettings = {
    enabled: false,
    count: 0,
    title: 'Coming Soon',
    artist: 'Your Debut Here',
    image_url: '',
};

const SETTINGS_DOC = doc(db, 'settings', 'placeholders');

async function fetchPlaceholderSettings(): Promise<PlaceholderSettings> {
    try {
        const snapshot = await getDoc(SETTINGS_DOC);
        if (!snapshot.exists()) return DEFAULT_PLACEHOLDER_SETTINGS;
        return { ...DEFAULT_PLACEHOLDER_SETTINGS, ...snapshot.data() } as PlaceholderSettings;
    } catch (error) {
        logError('Error loading placeholder settings:', error);
        return DEFAULT_PLACEHOLDER_SETTINGS;
    }
}

async function savePlaceholderSettings(settings: PlaceholderSettings): Promise<boolean> {
    try {
        await setDoc(SETTINGS_DOC, settings);
        return true;
    } catch (error) {
        logError('Error saving placeholder settings:', error);
        alert('Failed to save placeholder settings: ' + error);
        return false;
    }
}

export { fetchPlaceholderSettings, savePlaceholderSettings };
