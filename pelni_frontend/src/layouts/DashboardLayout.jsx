import { useState, useEffect } from 'react';
import PelniLogoSVG from '../assets/PELNI_2023.svg?url';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal';

// Definisikan komponen logo PELNI
const PelniLogo = () => (
    <img src={PelniLogoSVG} alt="Pelni Logo" className="h-10 mt-4"/> // Gunakan className untuk styling
);

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isInputDropdownOpen, setInputDropdownOpen] = useState(false);
    const isInputParentActive = location.pathname.startsWith('/dashboard/input-');

    useEffect(() => {
        if (isInputParentActive) {
            setInputDropdownOpen(true);
        }
    }, [isInputParentActive]);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const response = await api.get('/user', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    // Simpan seluruh data user ke state
                    setUser(response.data); 
                } catch (error) {
                    console.error("Gagal mengambil data user:", error);
                    // Jika token tidak valid, mungkin arahkan ke login
                    if (error.response && error.response.status === 401) {
                        navigate('/login');
                    }
                }
            }
        };

        fetchUserData();
    }, [navigate]); // Tambahkan navigate sebagai dependensi
    
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
            setUser(null);
            setModalOpen(false);
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
                <p className="mt-4 rounded-lg py-0 px-4  font-semibold text-blue-300 bg-gray-700 text-[#D9D9D9 ">Halo, {user ? user.name : '...'}</p>
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

            <div className="flex flex-col">
                <button
                    onClick={() => setInputDropdownOpen(!isInputDropdownOpen)}
                    className={`flex w-full items-center justify-center rounded-lg py-2 px-4 text-center font-semibold ${
                        isInputParentActive
                        ? 'bg-[#86B6FF] text-[#1A2238]'
                        : 'text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]'
                    }`}
                >
                    Input Jadwal
                    {/* Ikon panah yang berputar */}
                    <svg className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${isInputDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>

                {/* 5. Daftar link dropdown yang muncul/hilang */}
                <div className={`mt-2 flex flex-col space-y-2 overflow-hidden transition-all duration-300 ease-in-out ${isInputDropdownOpen ? 'max-h-40' : 'max-h-0'}`}>
                    <NavLink
                        to="/dashboard/input-jadwal"
                        className={({ isActive }) => `rounded-lg py-2 px-8 text-left text-sm font-semibold ${
                            isActive
                            ? 'bg-blue-300 text-[#1A2238]'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        Input Emplooi
                    </NavLink>
                    <NavLink
                        to="/dashboard/input-docking"
                        className={({ isActive }) => `rounded-lg py-2 px-8 text-left text-sm font-semibold ${
                            isActive
                            ? 'bg-blue-300 text-[#1A2238]'
                            : 'text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        Input Docking
                    </NavLink>
                </div>
            </div>

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