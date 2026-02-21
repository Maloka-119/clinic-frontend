import React, { useEffect, useState } from 'react';
import { UserPlus, Eye, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatients, createPatient } from '../services/api';
import '../styles.css';

const getClinicId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.clinicId ?? null;
    } catch {
        return null;
    }
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clinicId, setClinicId] = useState(getClinicId());
    const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: '', contactInfo: '' });
    const doctorName = localStorage.getItem('doctorName') || JSON.parse(localStorage.getItem('user') || '{}').name || 'User';

    const loadPatients = () => {
        const cid = getClinicId();
        setClinicId(cid);
        if (!cid) {
            setPatients([]);
            return;
        }
        getPatients(cid)
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : [];
                setPatients(list);
                setFilteredPatients(list);
            })
            .catch((err) =>
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'Could not load patients'
                })
            );
    };

    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        let filtered = patients;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = patients.filter(
                (p) =>
                    (p.name && p.name.toLowerCase().includes(q)) ||
                    (p.contactInfo && String(p.contactInfo).toLowerCase().includes(q))
            );
        }
        setFilteredPatients(filtered);
    }, [searchQuery, patients]);

    const handleAddPatient = async (e) => {
        e.preventDefault();
        const cid = getClinicId();
        if (!cid) {
            Swal.fire({ icon: 'warning', title: 'Error', text: 'No clinic assigned' });
            return;
        }
        if (!newPatient.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Patient name is required' });
            return;
        }
        try {
            await createPatient({
                name: newPatient.name.trim(),
                age: newPatient.age ? Number(newPatient.age) : null,
                gender: newPatient.gender.trim() || null,
                contactInfo: newPatient.contactInfo.trim() || null,
                clinicId: cid
            });
            setIsModalOpen(false);
            setNewPatient({ name: '', age: '', gender: '', contactInfo: '' });
            loadPatients();
            Swal.fire({ icon: 'success', title: 'Patient added successfully!', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Could not save patient'
            });
        }
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: 'You will be logged out!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, log me out'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('token');
                localStorage.removeItem('doctorName');
                localStorage.removeItem('userRole');
                localStorage.removeItem('user');
                navigate('/');
                Swal.fire({ icon: 'success', title: 'Logged Out!', showConfirmButton: false, timer: 1500 });
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
                    fontWeight: '600',
                    fontSize: '1.1rem'
                }}
            >
                <span>Welcome back, {doctorName}!</span>
                <button
                    className="btn btn-secondary"
                    onClick={handleLogout}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'white',
                        color: '#3B82F6',
                        padding: '5px 10px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        border: 'none'
                    }}
                >
                    <LogOut size={16} /> Log Out
                </button>
            </header>

            <div className="page-header">
                <h1 className="title">Patients Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={20} /> Add New Patient
                </button>
            </div>

            {!clinicId ? (
                <p style={{ color: '#64748b' }}>No clinic assigned. Contact your clinic owner or admin.</p>
            ) : (
                <>
                    <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
                        <input
                            type="text"
                            placeholder="Search by name or contact"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ flex: 2, padding: '8px' }}
                        />
                    </div>

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Age</th>
                                    <th>Gender</th>
                                    <th>Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPatients.length === 0 && (
                                    <tr>
                                        <td colSpan="6">No patients yet. Add one to get started.</td>
                                    </tr>
                                )}
                                {filteredPatients.map((p) => (
                                    <tr key={p.id}>
                                        <td><code>{p.id}</code></td>
                                        <td>{p.name}</td>
                                        <td>{p.age ?? '—'}</td>
                                        <td>{p.gender ?? '—'}</td>
                                        <td>{p.contactInfo ?? '—'}</td>
                                        <td>
                                            <Link to={`/patient/${p.id}`} style={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Eye size={20} /> View & Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="title">Add Patient</h2>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddPatient}>
                            <div className="input-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newPatient.name}
                                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="input-group">
                                <label>Age</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={newPatient.age}
                                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Gender</label>
                                <input
                                    type="text"
                                    value={newPatient.gender}
                                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                                    placeholder="e.g. Female"
                                />
                            </div>
                            <div className="input-group">
                                <label>Contact info</label>
                                <input
                                    type="text"
                                    value={newPatient.contactInfo}
                                    onChange={(e) => setNewPatient({ ...newPatient, contactInfo: e.target.value })}
                                    placeholder="Phone or email"
                                />
                            </div>
                            <div className="action-row">
                                <button type="submit" className="btn btn-primary">Save Patient</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
