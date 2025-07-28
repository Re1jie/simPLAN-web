import { useState } from 'react';
import PelniLogoSVG from '../assets/PELNI_2023.svg?url';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

// Definisikan komponen logo PELNI
const PelniLogo = () => (
    <img src={PelniLogoSVG} alt="Pelni Logo" className="h-10 mt-4"/> // Gunakan className untuk styling
);

const Sidebar = () => {
    const navigate = useNavigate();
    const [isModalOpen, setModalOpen] = useState(false);

    const executeLogout = async () => {
        const token = localStorage.getItem('authToken');
        try {
            await api.post('/logout', {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Logout dari server berhasil.');
        } catch (error) {
            console.error('Gagal logout di server:', error);
        } finally {
            localStorage.removeItem('authToken');
            setModalOpen(false); // Tutup modal setelah selesai
            navigate('/login');
        }
    };
    // Fungsi untuk menangani logout
    const handleLogoutClick = () => {
        setModalOpen(true);
    };

    // Data user & navigasi bisa dibuat dinamis nanti
    return (
        <>
        <div className="flex h-screen w-64 flex-col bg-[#1A2238] p-6 text-white">
            <PelniLogo />
            
            <div className="mt-8 flex flex-col items-center">
                <div className="h-32 w-32 rounded-full bg-gray-400"></div>
                <p className="mt-4 rounded-lg py-0 px-4  font-semibold text-blue-300 bg-gray-700 text-[#D9D9D9 ">Halo, Fikri</p>
            </div>
            
            <nav className="mt-8 flex flex-col space-y-2.5">
            <NavLink
                to="/dashboard"
                end
                className={({ isActive }) =>
                `rounded-lg py-2 px-4 text-center font-semibold ${
                    isActive
                    ? 'bg-[#86B6FF] text-[#1A2238]'
                    : 'text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]'
                }`
                }
            >
                Dashboard
            </NavLink>

            <NavLink
                to="/dashboard/input-jadwal"
                className={({ isActive }) =>
                `rounded-lg py-2 px-4 text-center font-semibold ${
                    isActive
                    ? 'bg-[#86B6FF] text-[#1A2238]'
                    : 'text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]'
                }`
                }
            >
                Input Jadwal
            </NavLink>

            <NavLink
                to="/dashboard/lihat-jadwal"
                className={({ isActive }) =>
                `rounded-lg py-2 px-4 text-center font-semibold ${
                    isActive
                    ? 'bg-[#86B6FF] text-[#1A2238]'
                    : 'text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]'
                }`
                }
            >
                Lihat Jadwal
            </NavLink>
            <NavLink
                to="/dashboard/plan-preview"
                className={({ isActive }) =>
                `rounded-lg py-2 px-4 text-center font-semibold ${
                    isActive
                    ? 'bg-[#86B6FF] text-[#1A2238]'
                    : 'text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]'
                }`
                }
            >
                Plan Preview
            </NavLink>
            </nav>
            
            <div className="flex-grow" />

            <button
                onClick={handleLogoutClick}
                className="rounded-lg py-2 px-4 hover:bg-red-700"
            >
                Logout
            </button>
            
        </div>
        {/* Render confirmation modal */}
        <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={executeLogout}
                title="Konfirmasi Logout"
            >
                <p>Apakah Anda yakin ingin keluar dari sesi ini?</p>
            </ConfirmationModal>
        </>
    );
};


function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100"> {/* 1. Buat pembungkus setinggi layar */}
      <Sidebar />
      {/* 2. Jadikan area main bisa di-scroll secara independen */}
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
export default DashboardLayout;