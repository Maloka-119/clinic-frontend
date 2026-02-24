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

const StatusBadge = ({ active }) => (
    <span
        className={`status-badge ${active ? 'status-badge--active' : 'status-badge--inactive'}`}
        role="status"
    >
        {active ? 'Active' : 'Inactive'}
    </span>
);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [clinics, setClinics] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState('clinics');
    const [showClinicModal, setShowClinicModal] = useState(false);
    const [clinicForm, setClinicForm] = useState({
        name: '',
        type: 'GYNECOLOGY',
        ownerName: '',
        ownerEmail: '',
        ownerPassword: ''
    });
    const displayName = 'Malak';

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

    useEffect(() => {
        loadClinics();
        loadUsers();
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
            const res = await toggleClinicActive(clinic.id);
            const updatedClinic = res.data?.clinic;
            const newActive = updatedClinic && (updatedClinic.isActive === true || updatedClinic.isActive === 1);
            if (updatedClinic != null) {
                setClinics((prev) =>
                    prev.map((c) => (c.id === clinic.id ? { ...c, isActive: Boolean(newActive) } : c))
                );
            } else {
                loadClinics();
            }
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

    const handleToggleUserActive = async (user) => {
        const currentlyActive = Boolean(user.isActive);
        const action = currentlyActive ? 'deactivate' : 'activate';
        const { value } = await Swal.fire({
            title: `${action} ${user.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        });
        if (!value) return;
        try {
            const res = await toggleEmployeeActive(user.id);
            const updatedUser = res.data?.user;
            const newActive = updatedUser && (updatedUser.isActive === true || updatedUser.isActive === 1);
            if (updatedUser != null) {
                setUsers((prev) =>
                    prev.map((u) => (u.id === user.id ? { ...u, isActive: Boolean(newActive) } : u))
                );
            } else {
                loadUsers();
            }
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
            <header className="app-header">
                <span>{displayName}</span>
                <div className="header-actions">
                    <Link to="/" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Home
                    </Link>
                    <Link to="/change-password" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Change password
                    </Link>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ background: 'white', color: '#3B82F6' }}
                        onClick={handleLogout}
                        title="Log out"
                        aria-label="Log out"
                    >
                        🔒 Log out
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
            </div>

            {tab === 'clinics' && (
                <div className="clinics-table-wrapper">
                    <div className="table-container">
                        <table style={{ tableLayout: 'fixed', minWidth: '640px' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '80px' }}>Clinic ID</th>
                                    <th style={{ width: '20%' }}>Name</th>
                                    <th style={{ width: '12%' }}>Type</th>
                                    <th style={{ width: '28%' }}>Owner</th>
                                    <th style={{ width: '100px' }}>Active</th>
                                    <th style={{ width: '130px' }}>Actions</th>
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
                                    const isActive = Boolean(c.isActive);
                                    return (
                                        <tr key={c.id}>
                                            <td>
                                                <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{c.id}</code>
                                            </td>
                                            <td>{c.name || '—'}</td>
                                            <td>{c.type || '—'}</td>
                                            <td>
                                                {owner ? (
                                                    <span title={`${owner.name} (${owner.email})`}>
                                                        {owner.name} ({owner.email})
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>
                                                <StatusBadge active={isActive} />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary clinic-toggle-btn"
                                                    style={{ marginRight: '4px' }}
                                                    onClick={() => handleToggleClinicActive(c)}
                                                    title={isActive ? 'Deactivate clinic' : 'Activate clinic'}
                                                >
                                                    {isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === 'users' && (
                <div className="users-tab-wrapper table-container">
                    {(() => {
                        const usersByClinic = {};
                        const clinicIdToName = {};
                        clinics.forEach((cl) => {
                            clinicIdToName[cl.id] = cl.name;
                        });
                        users.forEach((u) => {
                            if (u.role === 'ADMIN') return;
                            const key = u.clinicId != null ? u.clinicId : 'no-clinic';
                            if (!usersByClinic[key]) usersByClinic[key] = [];
                            usersByClinic[key].push(u);
                        });
                        const clinicIds = clinics.map((c) => c.id);
                        const orderedKeys = [...clinicIds.filter((id) => usersByClinic[id]?.length), 'no-clinic'].filter((k) => usersByClinic[k]?.length);
                        if (orderedKeys.length === 0 && users.filter((u) => u.role !== 'ADMIN').length === 0) {
                            return (
                                <p style={{ padding: '1.5rem', color: '#64748b' }}>No users (owners/employees) yet.</p>
                            );
                        }
                        return orderedKeys.map((key) => {
                            const firstUser = (usersByClinic[key] || [])[0];
                            const clinicName = key === 'no-clinic'
                                ? 'No clinic assigned'
                                : (firstUser?.Clinic?.name || clinicIdToName[key] || `Clinic #${key}`);
                            const list = usersByClinic[key] || [];
                            return (
                                <div key={key} style={{ marginBottom: '1.5rem' }}>
                                    <h3 style={{ margin: '0 0 0.75rem 0', padding: '0.5rem 0', borderBottom: '2px solid #e2e8f0', color: '#1e293b', fontSize: '1.1rem' }}>
                                        {clinicName}
                                    </h3>
                                    <table style={{ tableLayout: 'auto', width: '100%' }}>
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
                                            {list.map((u) => (
                                                <tr key={u.id}>
                                                    <td>{u.name}</td>
                                                    <td>{u.email}</td>
                                                    <td>{u.role}</td>
                                            <td>
                                                <StatusBadge active={Boolean(u.isActive)} />
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-secondary user-toggle-btn"
                                                    style={{ marginRight: '4px' }}
                                                    onClick={() => handleToggleUserActive(u)}
                                                    title={u.isActive ? 'Deactivate user' : 'Activate user'}
                                                >
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        });
                    })()}
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
