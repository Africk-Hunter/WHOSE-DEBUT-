import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsReady } from '../utilities/database/firebaseClient';

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        analyticsReady.then(async (analytics) => {
            if (!analytics) return;
            const { logEvent } = await import('firebase/analytics');
            logEvent(analytics, 'page_view', {
                page_path: location.pathname + location.search,
            });
        });
    }, [location]);
}
