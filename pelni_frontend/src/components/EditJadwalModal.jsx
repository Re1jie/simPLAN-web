// src/components/EditJadwalModal.jsx

import { useState } from 'react';

function EditJadwalModal({ isOpen, onClose, onConfirm, voyageData, isLoading }) {
  const [rawText, setRawText] = useState('');

  if (!isOpen || !voyageData) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rawText.trim()) {
        alert('Data jadwal tidak boleh kosong.');
        return;
    }
    onConfirm(rawText);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900">
              Edit Jadwal <span className="text-yellow-600">{voyageData.namaKapal}</span> - Voyage <span className="text-yellow-600">{voyageData.voyage}</span>
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Paste data baru dari Excel untuk menimpa jadwal yang sudah ada.
            </p>

            <div className="mt-4">
              <label htmlFor="raw_text_edit" className="block text-sm font-medium text-gray-700">Paste Data Excel Disini</label>
              <textarea
                id="raw_text_edit"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="mt-1 h-80 w-full rounded-md border border-gray-300 p-4 font-mono shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Contoh: Tg.Priok ... Minggu 29-Dec-24 00:00..."
                required
              />
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="flex justify-end items-center p-4 bg-gray-50 rounded-b-xl space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 font-bold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditJadwalModal;