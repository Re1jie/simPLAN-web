import React from 'react';

function ConfirmationModal({ isOpen, onClose, onConfirm, title, children }) {
  if (!isOpen) {
    return null;
  }

  return (
    // Latar belakang gelap (overlay)
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose} // Menutup modal jika area luar diklik
    >
      {/* Kontainer Modal */}
      <div 
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} // Mencegah penutupan modal saat kontennya diklik
      >
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        
        <div className="mt-4 text-gray-600">
          {children}
        </div>

        {/* Tombol Aksi */}
        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 font-bold text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Ya, Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;