import React from 'react';
import { logError } from '../utilities/logger';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false };

    static getDerivedStateFromError(): ErrorBoundaryState {
        return { hasError: true };
    }

    componentDidCatch(error: unknown) {
        logError('Unhandled error in component tree:', error);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="errorScreen">
                    <p className="errorScreenText">Something went wrong.</p>
                    <button className="errorScreenButton" onClick={() => window.location.assign('/')}>
                        Back to WHOSE DEBUT?
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
