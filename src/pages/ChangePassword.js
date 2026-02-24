import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { changePassword } from '../services/api';
import '../styles.css';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!oldPassword || !newPassword) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please enter current and new password.' });
            return;
        }
        if (newPassword.length < 6) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'New password must be at least 6 characters.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'New password and confirmation do not match.' });
            return;
        }
        setLoading(true);
        try {
            await changePassword({ oldPassword, newPassword });
            Swal.fire({ icon: 'success', title: 'Password updated', text: 'Your password has been changed. You can continue using the app.', showConfirmButton: false, timer: 2000 });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            navigate(-1);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to change password.';
            Swal.fire({ icon: 'error', title: 'Error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
    const backPath = role === 'ADMIN' ? '/admin' : role === 'OWNER' ? '/clinic-owner' : '/dashboard';

    return (
        <div className="container">
            <div style={{ marginBottom: '1rem' }}>
                <Link to={backPath} style={{ color: '#2563eb' }}>← Back</Link>
            </div>
            <div className="card" style={{ maxWidth: '420px', margin: '2rem auto' }}>
                <h2 style={{ marginBottom: '1rem' }}>Change Password</h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Enter your current password and choose a new one.</p>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Current password</label>
                        <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="input-group">
                        <label>New password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="input-group">
                        <label>Confirm new password</label>
                        <input
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>
                    <div className="action-row" style={{ display: 'flex', gap: '8px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Updating...' : 'Change password'}
                        </button>
                        <Link to={backPath} className="btn btn-secondary">Cancel</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
