import { Routes, Route } from 'react-router-dom';
import Main from './pages/main';
import AdminPanel from './pages/admin';
import AdminDashboard from './pages/adminDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
    </Routes>
  );
}

export default App;
