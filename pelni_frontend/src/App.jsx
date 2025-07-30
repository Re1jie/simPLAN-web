// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout'; 
import DashboardPage from './pages/DashboardPage';   
import InputJadwalPage from './pages/InputJadwalPage';
import LihatJadwalPage from './pages/LihatJadwalPage';
import LihatDockingPage from './pages/LihatDockingPage';
import PlanPreviewPage from './pages/PlanPreviewPage';
import InputDockingPage from './pages/InputDockingPage';
import PlanPublicPage from './pages/PlanPublicPage';
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<LoginPage />} />

        {/* Buat rute pembungkus yang dijaga oleh ProtectedRoute */}
        <Route element={<ProtectedRoute />}>
          {/* Semua rute di dalam sini sekarang dilindungi */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="input-jadwal" element={<InputJadwalPage />} />
            <Route path="lihat-jadwal" element={<LihatJadwalPage />} />
            <Route path="lihat-docking" element={<LihatDockingPage />} />
            <Route path="plan-preview" element={<PlanPreviewPage />} />
            <Route path="input-docking" element={<InputDockingPage />} />
            <Route path="plan-public" element={<PlanPublicPage />} />
          </Route>
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;