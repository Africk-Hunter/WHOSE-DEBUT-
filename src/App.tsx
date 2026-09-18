import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Main from './pages/main';
import About from './pages/about';
import LoadingScreen from './components/LoadingScreen';

const AdminPanel = lazy(() => import('./pages/admin'));
const AdminDashboard = lazy(() => import('./pages/adminDashboard'));

function App() {
  return (
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
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
