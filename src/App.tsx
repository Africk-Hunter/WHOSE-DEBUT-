import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Main from './pages/main';
import LoadingScreen from './components/LoadingScreen';
import ErrorBoundary from './components/ErrorBoundary';
import usePageTracking from './hooks/usePageTracking';

const AdminPanel = lazy(() => import('./pages/admin'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));
const About = lazy(() => import('./pages/about'));
const Submission = lazy(() => import('./pages/submission'));

function App() {
  usePageTracking();

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminPanel />
            </Suspense>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminDashboard />
            </Suspense>
          }
        />
        <Route path="/album/:albumId" element={<Main />} />
        <Route
          path="/about"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <About />
            </Suspense>
          }
        />
        <Route
          path="/submission"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <Submission />
            </Suspense>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
