import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    listClinics,
    createClinic,
    listEmployees,
    toggleClinicActive,
    toggleEmployeeActive
} from '../services/api';
import '../styles.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [clinics, setClinics] = useState([]);
    const [users, setUsers] = useState([]);
    const [pending, setPending] = useState([]);
    const [tab, setTab] = useState('clinics');
    const [showClinicModal, setShowClinicModal] = useState(false);
    const [clinicForm, setClinicForm] = useState({
        name: '',
        type: 'GYNECOLOGY',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    });
    const doctorName = localStorage.getItem('doctorName') || 'Admin';

    const loadClinics = () => {
        listClinics()
            .then((res) => setClinics(Array.isArray(res.data) ? res.data : []))
            .catch((err) =>
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'Could not load clinics'
                })
            );
    };

    const loadUsers = () => {
        listEmployees()
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch((err) =>
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'Could not load users'
                })
            );
    };

    const loadPending = () => {
        setPending([]);
    };

    useEffect(() => {
        loadClinics();
        loadUsers();
        loadPending();
    }, []);

    const owners = users.filter((u) => u.role === 'OWNER');
    const getOwnerForClinic = (clinicId) => owners.find((o) => o.clinicId === clinicId);

    const handleCreateClinic = async (e) => {
        e.preventDefault();
        if (!clinicForm.name || !clinicForm.ownerEmail || !clinicForm.ownerName || !clinicForm.ownerPassword) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Fill all fields' });
            return;
        }
        try {
            const res = await createClinic(clinicForm);
            setShowClinicModal(false);
            setClinicForm({ name: '', type: 'GYNECOLOGY', ownerName: '', ownerEmail: '', ownerPassword: '' });
            loadClinics();
            loadUsers();
            const clinic = res.data?.clinic || {};
            Swal.fire({
                icon: 'success',
                title: 'Clinic Created',
                html: `
                    Clinic ID: <strong>${clinic.id ?? '—'}</strong><br/>
                    Name: <strong>${clinic.name ?? '—'}</strong><br/>
                    Owner must be activated to use the system.
                `
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to create clinic'
            });
        }
    };

    const handleToggleClinicActive = async (clinic) => {
        const action = clinic.isActive ? 'deactivate' : 'activate';
        const { value } = await Swal.fire({
            title: `${action} clinic "${clinic.name}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        });
        if (!value) return;
        try {
            await toggleClinicActive(clinic.id);
            loadClinics();
            Swal.fire({
                icon: 'success',
                title: `Clinic ${action}d`,
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed'
            });
        }
    };

    const handleToggleUserActive = async (user, isActive) => {
        const action = isActive ? 'activate' : 'deactivate';
        const { value } = await Swal.fire({
            title: `${action} ${user.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        });
        if (!value) return;
        try {
            await toggleEmployeeActive(user.id);
            loadUsers();
            Swal.fire({
                icon: 'success',
                title: `User ${action}d`,
                showConfirmButton: false,
                timer: 1500
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed'
            });
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

    return (
        <div className="container">
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    margin: '15px 0',
                    padding: '15px 20px',
                    background: 'linear-gradient(90deg, #6EE7B7, #3B82F6)',
                    color: 'white',
                    borderRadius: '12px',
                    fontWeight: '600'
                }}
            >
                <span>Admin: {doctorName}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Home
                    </Link>
                    <button
                        className="btn btn-secondary"
                        style={{ background: 'white', color: '#3B82F6' }}
                        onClick={handleLogout}
                    >
                        Log Out
                    </button>
                </div>
            </header>

            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1 className="title">Admin Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setShowClinicModal(true)}>
                    + Add Clinic
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                <button
                    className={tab === 'clinics' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setTab('clinics')}
                >
                    Clinics
                </button>
                <button
                    className={tab === 'users' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setTab('users')}
                >
                    Users
                </button>
                <button
                    className={tab === 'pending' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setTab('pending')}
                >
                    Pending ({pending.length})
                </button>
            </div>

            {tab === 'clinics' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Clinic ID</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Owner</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clinics.length === 0 && (
                                <tr>
                                    <td colSpan="6">No clinics yet. Create one to get started.</td>
                                </tr>
                            )}
                            {clinics.map((c) => {
                                const owner = getOwnerForClinic(c.id);
                                return (
                                    <tr key={c.id}>
                                        <td>
                                            <code>{c.id}</code>
                                        </td>
                                        <td>{c.name}</td>
                                        <td>{c.type || '—'}</td>
                                        <td>
                                            {owner ? `${owner.name} (${owner.email})` : '—'}
                                        </td>
                                        <td>{c.isActive ? 'Yes' : 'No'}</td>
                                        <td>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ marginRight: '4px' }}
                                                onClick={() => handleToggleClinicActive(c)}
                                            >
                                                {c.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'users' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan="5">No users (owners/employees) yet.</td>
                                </tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.role}</td>
                                    <td>{u.isActive ? 'Yes' : 'No'}</td>
                                    <td>
                                        {u.role !== 'ADMIN' && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ marginRight: '4px' }}
                                                onClick={() => handleToggleUserActive(u, !u.isActive)}
                                            >
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === 'pending' && (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Clinic</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pending.length === 0 && (
                                <tr>
                                    <td colSpan="4">No pending requests</td>
                                </tr>
                            )}
                            {pending.map((u) => (
                                <tr key={u.id}>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>{u.Clinic?.name || u.clinicId || '—'}</td>
                                    <td>—</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showClinicModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Clinic</h2>
                            <button className="close-modal" onClick={() => setShowClinicModal(false)}>
                                ×
                            </button>
                        </div>
                        <form onSubmit={handleCreateClinic}>
                            <div className="input-group">
                                <label>Clinic Name</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicForm.name}
                                    onChange={(e) => setClinicForm({ ...clinicForm, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Clinic Type</label>
                                <select
                                    value={clinicForm.type}
                                    onChange={(e) => setClinicForm({ ...clinicForm, type: e.target.value })}
                                >
                                    <option value="GYNECOLOGY">Gynecology</option>
                                    <option value="GENERAL">General</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Owner Name</label>
                                <input
                                    type="text"
                                    required
                                    value={clinicForm.ownerName}
                                    onChange={(e) => setClinicForm({ ...clinicForm, ownerName: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Owner Email</label>
                                <input
                                    type="email"
                                    required
                                    value={clinicForm.ownerEmail}
                                    onChange={(e) => setClinicForm({ ...clinicForm, ownerEmail: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Owner Password</label>
                                <input
                                    type="password"
                                    required
                                    value={clinicForm.ownerPassword}
                                    onChange={(e) =>
                                        setClinicForm({ ...clinicForm, ownerPassword: e.target.value })
                                    }
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    Create Clinic
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowClinicModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
