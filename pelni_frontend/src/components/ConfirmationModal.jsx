import React from 'react';

function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Ya, Lanjutkan", // Default text
  confirmButtonClass = "bg-red-600 hover:bg-red-700" // Default class (merah)
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        
        <div className="mt-4 text-gray-600">
          {children}
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            // Gunakan props untuk menentukan class dan teks tombol
            className={`px-4 py-2 font-bold text-white rounded-md ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;