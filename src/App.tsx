import { Routes, Route } from 'react-router-dom';
import Main from './pages/main';
import AdminPanel from './pages/admin';
import AdminDashboard from './pages/adminDashboard';
import AlbumView from './pages/albumView';
import About from './pages/about';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/album/:albumId" element={<AlbumView />} />
      <Route path="/about" element={<About />} />
    </Routes>
  );
}

export default App;
