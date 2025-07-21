import React from 'react';

type RoleModalProps = {
  open: boolean;
  onClose: () => void;
};

const RoleModal: React.FC<RoleModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="modal" style={{ display: 'flex' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content transparent-box">
        <h2>Choose Your Role</h2>
        <button className="role-btn" onClick={() => window.location.href = '/user/auth'}>User</button>
        <button className="role-btn" onClick={() => window.location.href = '/volunteer/auth'}>Volunteer</button>
        <button className="role-btn" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default RoleModal;
