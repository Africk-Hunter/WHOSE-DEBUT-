import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const envText = fs.readFileSync('C:/web_dev/WHOSE-DEBUT-/.env', 'utf-8');
const env = {};
for (const line of envText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
}

const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const snap = await getDocs(collection(db, 'albums'));
snap.forEach(doc => {
    const d = doc.data();
    console.log(JSON.stringify({
        id: doc.id,
        name: d.name,
        spotify: d.spotify,
        apple: d.apple,
        bandcamp: d.bandcamp,
        amazon: d.amazon,
    }));
});
console.log('Total albums:', snap.size);
process.exit(0);
