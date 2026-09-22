import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { analyticsReady } from '../utilities/database/firebaseClient';

export default function usePageTracking() {
    const location = useLocation();

    useEffect(() => {
        analyticsReady.then((analytics) => {
            if (!analytics) return;
            logEvent(analytics, 'page_view', {
                page_path: location.pathname + location.search,
            });
        });
    }, [location]);
}
