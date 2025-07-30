// src/pages/LoginPage.jsx

import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Komponen Logo PELNI (bisa diganti dengan file gambar Anda)
import PelniLogoSVG from '../assets/PELNI_2023.svg?url';

const PelniLogo = () => (
  <img src={PelniLogoSVG} alt="Pelni Logo" width={200} height={80} />
);

import BgLogin from '../assets/bg-login.jpg';


function LoginPage() {
  const navigate = useNavigate(); // Akan kita aktifkan nanti

  // State untuk menyimpan data input dari form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fungsi yang dijalankan saat form di-submit
  const handleLogin = async (event) => {
    event.preventDefault(); // Mencegah halaman refresh saat submit
    setLoading(true);
    setError('');

    try {
      // Kirim request ke API Laravel Anda
      const response = await api.post('/login', {
        email: email,
        password: password,
      });

      setLoading(false);
      // alert('Login Berhasil!'); // Untuk sementara, kita tampilkan alert
      console.log('Token Anda:', response.data.token);
      
      // Simpan token ke localStorage untuk digunakan nanti
      sessionStorage.setItem('authToken', response.data.token);
      
      // Nanti kita akan redirect ke dashboard
      navigate('/dashboard');

    } catch (err) {
      setLoading(false);
      if (err.response && err.response.status === 422) {
        setError('Username atau Password tidak valid.');
      } else {
        setError('Terjadi kesalahan. Tidak dapat terhubung ke server.');
      }
      console.error('Login gagal:', err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cover bg-[position:center_bottom]" style={{ backgroundImage: `url(${BgLogin})` }}>
      <div className="w-full max-w-sm space-y-8 rounded-xl bg-[#141a2c] p-8 shadow-lg">
        <div className="flex justify-center">
          <PelniLogo />
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-600 bg-[#FBFCFE] px-3 py-2 text-[#1F2022] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="user@pelni.co.id"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-600 bg-[#FBFCFE] px-3 py-2 text-[#1F2022] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md border border-transparent bg-white py-2 px-4 text-sm font-medium text-gray-800 shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>

          {error && (
            <p className="text-center text-sm text-red-400">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginPage;