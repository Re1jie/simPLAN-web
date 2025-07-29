import React from "react";
import { useActivityLog } from '../hooks/useActivityLog';
import ActivityLog from '../components/ActivityLog';

function DashboardPage() {
    const { logs, isLoading } = useActivityLog();

    return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom untuk konten utama dashboard */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md">
             <h2 className="text-xl font-semibold">Selamat Datang di SimPLAN</h2>
             <p className="mt-2 text-gray-600">
               Pantau aktivitas terbaru terkait jadwal kapal di sisi kanan. Gunakan menu navigasi untuk mengelola data.
             </p>
          </div>
          {/* Anda bisa tambahkan komponen lain seperti grafik atau tabel di sini */}
        </div>

        {/* Kolom khusus untuk Log Aktivitas */}
        <div className="lg:col-span-1">
          {/* 4. Berikan data ke komponen UI */}
          <ActivityLog logs={logs} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;