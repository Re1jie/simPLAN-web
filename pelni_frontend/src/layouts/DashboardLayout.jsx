import { useState, useEffect } from 'react';
import PelniLogoSVG from '../assets/PELNI_2023.svg?url';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import {
    Home,
    ChevronDown,
    CalendarDays,
    Dock,
    Wrench,
    LayoutDashboard,
    LogOut,
    Ship,
    CalendarClock,
    Menu,
    X,
    ChartNoAxesGantt,
    Route,
    Anchor
} from "lucide-react";
import clsx from "clsx";


// Definisikan komponen logo PELNI
const PelniLogo = () => (
    <img src={PelniLogoSVG} alt="Pelni Logo" className="h-10 mt-0" /> // Gunakan className untuk styling
);

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isModalOpen, setModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [isInputDropdownOpen, setInputDropdownOpen] = useState(false);
    const [isLihatDropdownOpen, setLihatDropdownOpen] = useState(false);
    const [isPlanDropdownOpen, setPlanDropdownOpen] = useState(false);
    const [isLPKDropdownOpen, setLPKDropdownOpen] = useState(false);

    const isInputParentActive = location.pathname.startsWith("/dashboard/input-");
    const isLihatParentActive = location.pathname.startsWith("/dashboard/lihat-");
    const isPlanParentActive = location.pathname.startsWith("/dashboard/plan-");

    const isLPKParentActive = location.pathname.startsWith("/dashboard/lpk-");

    useEffect(() => {
        if (isInputParentActive) {
            setInputDropdownOpen(true);
        }
        if (isLihatParentActive) {
            setLihatDropdownOpen(true);
        }
        if (isPlanParentActive) {
            setPlanDropdownOpen(true);
        }
        if (isLPKParentActive) {
            setLPKDropdownOpen(true)
        }
    }, [isInputParentActive, isLihatParentActive, isPlanParentActive, isLPKDropdownOpen]);

    // Ambil data user
    useEffect(() => {
        const fetchUserData = async () => {
            const token = sessionStorage.getItem("authToken");
            if (token) {
                try {
                    const response = await api.get("/user", {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });
                    setUser(response.data);
                } catch (error) {
                    console.error("Gagal mengambil data user:", error);
                    if (error.response && error.response.status === 401) {
                        navigate("/login");
                    }
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    const executeLogout = async () => {
        const token = sessionStorage.getItem("authToken");
        try {
            await api.post(
                "/logout",
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            console.log("Logout dari server berhasil.");
        } catch (error) {
            console.error("Gagal logout di server:", error);
        } finally {
            sessionStorage.removeItem("authToken");
            setUser(null);
            setModalOpen(false);
            navigate("/login");
        }
    };

    const handleLogoutClick = () => {
        setModalOpen(true);
    };

    // Class helper
    const menuItemClass = ({ isActive }) =>
        clsx(
            "rounded-lg py-2 px-4 font-semibold flex items-center gap-2 transition-colors duration-200",
            isActive
                ? "bg-[#86B6FF] text-[#1A2238]"
                : "text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]"
        );

    const submenuClass = ({ isActive }) =>
        clsx(
            "rounded-lg py-2 pl-8 pr-4 text-sm font-semibold flex items-center gap-2 transition-colors duration-200",
            isActive
                ? "bg-blue-300 text-[#1A2238]"
                : "text-gray-300 hover:bg-gray-700"
        );
    
    // Class untuk tombol dropdown
    const dropdownButtonClass = "flex w-full items-center justify-between rounded-lg py-2 px-4 font-semibold cursor-pointer transition-colors duration-200 text-[#FBFCFE] hover:bg-gray-700 hover:text-[#D9D9D9]";

    return (
        <>
            <div className="flex h-screen w-64 flex-col bg-[#1A2238] p-6 text-white">
                <PelniLogo />

                {/* Profil */}
                <div className="mt-8 flex flex-col items-center">
                    <div className="h-24 w-24 rounded-full bg-gray-400"></div>
                    <p className="mt-4 rounded-lg px-4 font-semibold bg-gray-700 text-blue-300">
                        Halo, {user ? user.name : "..."}
                    </p>
                </div>

                <hr className="my-6 border-gray-700" />

                {/* Navigasi */}
                <nav className="flex flex-col space-y-2">
                    <NavLink to="/dashboard" end className={menuItemClass}>
                        <Home size={18} />
                        Home
                    </NavLink>

                    {/* Dropdown Input Jadwal */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => setInputDropdownOpen((prev) => !prev)}
                            className={dropdownButtonClass}
                        >
                            <span className="flex items-center gap-2">
                                <CalendarDays size={18} />
                                Input Jadwal
                            </span>
                            <ChevronDown
                                className={clsx(
                                    "h-4 w-4 transform transition-transform duration-200",
                                    isInputDropdownOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div
                            className={clsx(
                                "transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                                isInputDropdownOpen
                                    ? "max-h-40 opacity-100 mt-2"
                                    : "max-h-0 opacity-0"
                            )}
                        >
                            <NavLink to="/dashboard/input-jadwal" className={submenuClass}>
                                <LayoutDashboard size={16} />
                                Input Voyage
                            </NavLink>
                            <NavLink to="/dashboard/input-docking" className={submenuClass}>
                                <Dock size={16} />
                                Input Docking
                            </NavLink>
                        </div>
                    </div>

                    {/* Dropdown Lihat Jadwal */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => setLihatDropdownOpen((prev) => !prev)}
                            className={dropdownButtonClass}
                        >
                            <span className="flex items-center gap-2">
                                <Wrench size={18} />
                                Kelola Jadwal
                            </span>
                            <ChevronDown
                                className={clsx(
                                    "h-4 w-4 transform transition-transform duration-200",
                                    isLihatDropdownOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div
                            className={clsx(
                                "transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                                isLihatDropdownOpen
                                    ? "max-h-40 opacity-100 mt-2"
                                    : "max-h-0 opacity-0"
                            )}
                        >
                            <NavLink to="/dashboard/lihat-jadwal" className={submenuClass}>
                                <Ship size={16} />
                                Jadwal Voyage
                            </NavLink>
                            <NavLink to="/dashboard/lihat-docking" className={submenuClass}>
                                <CalendarClock size={16} />
                                Jadwal Docking
                            </NavLink>
                        </div>
                    </div>

                    {/* Plan Dropdown */}
                    <div className="flex flex-col">
                        <button
                            onClick={() => setPlanDropdownOpen((prev) => !prev)}
                            className={dropdownButtonClass}
                        >
                            <span className="flex items-center gap-2">
                                <Route size={18} />
                                Lihat Plan
                            </span>
                            <ChevronDown
                                className={clsx(
                                    "h-4 w-4 transform transition-transform duration-200",
                                    isPlanDropdownOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div
                            className={clsx(
                                "transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                                isPlanDropdownOpen
                                    ? "max-h-40 opacity-100 mt-2"
                                    : "max-h-0 opacity-0"
                            )}
                        >
                            <NavLink to="/dashboard/plan-preview" className={submenuClass}>
                                <ChartNoAxesGantt size={16} />
                                Plan (Copy)
                            </NavLink>
                            <NavLink to="/dashboard/plan-public" className={submenuClass}>
                                <ChartNoAxesGantt size={16} />
                                Plan (Public)
                            </NavLink>
                        </div>
                    </div>


                    <div className="flex flex-col">
                        <button
                            onClick={() => setLPKDropdownOpen((prev) => !prev)}
                            className={dropdownButtonClass}
                        >
                            <span className="flex items-center gap-2">
                                <Anchor size={18} />
                                LPK dan OTP
                            </span>
                            <ChevronDown
                                className={clsx(
                                    "h-4 w-4 transform transition-transform duration-200",
                                    isLPKDropdownOpen && "rotate-180"
                                )}
                            />
                        </button>

                        <div
                            className={clsx(
                                "transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
                                isLPKDropdownOpen
                                    ? "max-h-40 opacity-100 mt-2"
                                    : "max-h-0 opacity-0"
                            )}
                        >
                            <NavLink to="/dashboard/lpk-input" className={submenuClass}>
                                <Anchor size={16} />
                                Input LPK
                            </NavLink>
                            <NavLink to="/dashboard/lpk-lihat" className={submenuClass}>
                                <ChartNoAxesGantt size={16} />
                                Lihat OTP
                            </NavLink>
                        </div>
                    </div>


                    
                </nav>

                <div className="flex-grow" />

                <button
                    onClick={handleLogoutClick}
                    className="rounded-lg py-2 px-4 hover:bg-red-700 flex items-center gap-2 transition-colors duration-200"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {/* Modal konfirmasi */}
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
    const [isSidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="flex h-screen bg-gray-100 relative">
            {/* Sidebar */}
            <div
                className={clsx(
                    "fixed top-0 left-0 h-full z-20 transition-transform duration-300 ease-in-out",
                    {
                        "translate-x-0 w-64": isSidebarOpen,
                        "-translate-x-full w-64": !isSidebarOpen,
                    }
                )}
            >
                <Sidebar />
            </div>

            {/* Tombol Toggle Sidebar */}
            <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="fixed top-4 left-4 z-30 p-2 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-all duration-300 ease-in-out"
                style={{
                    left: isSidebarOpen ? "272px" : "16px", // 256 + 16
                }}
            >
                {isSidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            {/* Main Content */}
            <main
                className={clsx(
                    "flex-1 overflow-y-auto p-8 transition-all duration-300 ease-in-out",
                    {
                        "ml-64": isSidebarOpen,
                        "ml-0": !isSidebarOpen,
                    }
                )}
            >
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;
