import React from 'react';

type RoleModalProps = {
  open: boolean;
  onClose: () => void;
};

const RoleModal: React.FC<RoleModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xs flex flex-col items-center transition-all duration-300 transform animate-modalIn">
        <h2 className="text-2xl font-bold text-blue-700 mb-6">Choose Your Role</h2>
        <button className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 active:scale-95" onClick={() => window.location.href = '/user/auth'}>User</button>
        <button className="w-full mb-3 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 active:scale-95" onClick={() => window.location.href = '/volunteer/auth'}>Volunteer</button>
        <button className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-200 active:scale-95" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default RoleModal;
