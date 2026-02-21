import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { listClinicUsers, approveUser, rejectUser } from '../services/api';
import { getMe } from '../services/api';
import '../styles.css';

const ClinicOwnerDashboard = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [clinicId, setClinicId] = useState(null);
    const [loading, setLoading] = useState(true);
    const doctorName = localStorage.getItem('doctorName') || 'Clinic Owner';

    useEffect(() => {
        getMe()
            .then((res) => {
                const user = res.data?.user;
                if (user?.clinicId) {
                    setClinicId(user.clinicId);
                    return listClinicUsers(user.clinicId);
                }
                return { data: [] };
            })
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load users' }))
            .finally(() => setLoading(false));
    }, []);

    const loadUsers = () => {
        if (!clinicId) return;
        listClinicUsers(clinicId)
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load users' }));
    };

    const handleApprove = async (id) => {
        const { value } = await Swal.fire({
            title: 'Approve this user?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Approve'
        });
        if (!value) return;
        try {
            await approveUser(id);
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Approved', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleReject = async (id) => {
        const { value } = await Swal.fire({
            title: 'Reject this user?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reject'
        });
        if (!value) return;
        try {
            await rejectUser(id);
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Rejected', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Log out?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, log out'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('doctorName');
                localStorage.removeItem('userRole');
                localStorage.removeItem('user');
                navigate('/');
                Swal.fire({ icon: 'success', title: 'Logged out', showConfirmButton: false, timer: 1200 });
            }
        });
    };

    const pending = users.filter((u) => u.status === 'PENDING');
    const approved = users.filter((u) => u.status === 'APPROVED');

    return (
        <div className="container">
            <header style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                margin: '15px 0', padding: '15px 20px', background: 'linear-gradient(90deg, #6EE7B7, #3B82F6)',
                color: 'white', borderRadius: '12px', fontWeight: '600'
            }}>
                <span>Clinic Owner: {doctorName}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>Home</Link>
                    <button className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }} onClick={handleLogout}>Log Out</button>
                </div>
            </header>

            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1 className="title">Clinic Owner Dashboard</h1>
            </div>

            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                Approve or reject registration requests for your clinic. Share your Clinic ID with staff so they can register.
            </p>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <h2 style={{ marginTop: '1rem' }}>Pending requests ({pending.length})</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pending.length === 0 && <tr><td colSpan="3">No pending requests</td></tr>}
                                {pending.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>
                                            <button className="btn btn-primary" style={{ marginRight: '4px' }} onClick={() => handleApprove(u.id)}>Approve</button>
                                            <button className="btn btn-secondary" onClick={() => handleReject(u.id)}>Reject</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <h2 style={{ marginTop: '1.5rem' }}>Approved users ({approved.length})</h2>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {approved.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.name}</td>
                                        <td>{u.email}</td>
                                        <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default ClinicOwnerDashboard;
