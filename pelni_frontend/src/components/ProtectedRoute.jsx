// src/components/ProtectedRoute.jsx

import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
  // 1. Cek apakah ada token di localStorage
  const token = sessionStorage.getItem('authToken');

  // 2. Jika ada token, izinkan akses ke halaman yang diminta (melalui <Outlet />)
  //    Jika tidak ada, paksa redirect ke halaman login
  return token ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoute;