import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatients, createPatient } from '../services/api';
import '../styles.css';

const getClinicId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.clinicId || null;
    } catch {
        return null;
    }
};

const ClinicOwnerPatients = () => {
    const [patients, setPatients] = useState([]);
    const [clinicId, setClinicId] = useState(getClinicId());
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', age: '', gender: '', contactInfo: '' });

    const loadPatients = () => {
        if (!clinicId) return;
        getPatients(clinicId)
            .then((res) => setPatients(Array.isArray(res.data) ? res.data : []))
            .catch((err) => Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Could not load patients' }));
    };

    useEffect(() => {
        setClinicId(getClinicId());
    }, []);

    useEffect(() => {
        if (clinicId) {
            loadPatients();
        }
        setLoading(false);
    }, [clinicId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Patient name is required' });
            return;
        }
        if (!clinicId) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No clinic assigned' });
            return;
        }
        try {
            await createPatient({
                name: form.name.trim(),
                age: form.age ? Number(form.age) : null,
                gender: form.gender.trim() || null,
                contactInfo: form.contactInfo.trim() || null,
                clinicId
            });
            setShowModal(false);
            setForm({ name: '', age: '', gender: '', contactInfo: '' });
            loadPatients();
            Swal.fire({ icon: 'success', title: 'Patient added', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to add patient' });
        }
    };

    const doctorName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Clinic Owner';

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
                <span>Clinic Owner: {doctorName}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Link to="/clinic-owner" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        ← Dashboard
                    </Link>
                </div>
            </header>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 className="title">Patients Management</h1>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    + Add Patient
                </button>
            </div>

            {!clinicId ? (
                <p style={{ color: '#64748b' }}>No clinic assigned. Please contact admin.</p>
            ) : loading ? (
                <p>Loading...</p>
            ) : (
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Gender</th>
                                <th>Contact</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan="5">No patients yet. Add one to get started.</td>
                                </tr>
                            )}
                            {patients.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.age ?? '—'}</td>
                                    <td>{p.gender ?? '—'}</td>
                                    <td>{p.contactInfo ?? '—'}</td>
                                    <td>
                                        <Link to={`/patient/${p.id}`} className="btn btn-primary" style={{ textDecoration: 'none' }}>
                                            View & Manage Visits
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Patient</h2>
                            <button className="close-modal" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="input-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Age</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.age}
                                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Gender</label>
                                <input
                                    type="text"
                                    value={form.gender}
                                    placeholder="e.g. Female"
                                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Contact Info</label>
                                <input
                                    type="text"
                                    value={form.contactInfo}
                                    placeholder="Phone or email"
                                    onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">
                                    Add Patient
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
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

export default ClinicOwnerPatients;
