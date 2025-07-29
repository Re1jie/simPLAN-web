import React from 'react';
import { Clock, Ship, Anchor } from 'lucide-react';

const ActivityLog = ({ logs, isLoading }) => {
  if (isLoading && logs.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500">Memuat aktivitas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-semibold mb-4 border-b pb-3">Aktivitas Terbaru</h2>
      {logs.length > 0 ? (
        <ul className="divide-y divide-gray-200 overflow-y-auto max-h-96">
          {logs.map((log) => (
            <li key={log.id} className="py-4">
              <p className="text-sm font-medium text-gray-800">
                <span className="font-bold text-blue-600">{log.user}</span> {log.action.toLowerCase()}
              </p>
              <div className="text-xs text-gray-600 mt-2 flex items-center space-x-4">
                <span className="flex items-center">
                  <Ship className="w-3 h-3 mr-1.5" />
                  {log.context.kapal}
                </span>
                <span className="flex items-center">
                  <Anchor className="w-3 h-3 mr-1.5" />
                  Voyage: {log.context.voyage}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2 flex items-center">
                <Clock className="w-3 h-3 mr-1.5" />
                {new Date(log.timestamp).toLocaleString('id-ID')}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center py-4">Belum ada aktivitas.</p>
      )}
    </div>
  );
};

export default ActivityLog;