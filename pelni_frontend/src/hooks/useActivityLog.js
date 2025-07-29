import { useState, useEffect } from 'react';
import { ref, onChildAdded, off, query, orderByChild, limitToLast } from 'firebase/database';
import { database } from '../firebase'; // Import dari file konfigurasi

/**
 * Custom hook untuk mendapatkan log aktivitas dari Firebase secara real-time.
 * @returns {{logs: Array, isLoading: boolean}}
 */
export const useActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Referensi ke 'activity_log' di database
    // Kita urutkan berdasarkan timestamp dan ambil 20 log terakhir saja
    const activityLogRef = query(
      ref(database, 'activity_log'), 
      orderByChild('timestamp'), 
      limitToLast(20)
    );

    const handleNewLog = (snapshot) => {
      const newLog = { id: snapshot.key, ...snapshot.val() };
      // Tambahkan log baru ke awal array state agar yang terbaru muncul di atas
      setLogs((prevLogs) => [newLog, ...prevLogs]);
      setIsLoading(false); // Set loading ke false setelah data pertama diterima
    };

    // Mulai mendengarkan data baru
    const listener = onChildAdded(activityLogRef, handleNewLog);

    // Fungsi cleanup: Hentikan listener saat komponen tidak lagi digunakan
    return () => {
      off(activityLogRef, 'child_added', listener);
    };
  }, []); // Array kosong berarti efek ini hanya berjalan sekali

  return { logs, isLoading };
};