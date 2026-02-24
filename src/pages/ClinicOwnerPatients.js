import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { getPatients } from '../services/api';
import OwnerPatientForm from '../components/OwnerPatientForm';
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

    const doctorName = JSON.parse(localStorage.getItem('user') || '{}').name || 'Clinic Owner';

    return (
        <div className="container">
            <header className="app-header">
                <span>Clinic Owner: {doctorName}</span>
                <div className="header-actions">
                    <Link to="/clinic-owner" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        ← Dashboard
                    </Link>
                    <Link to="/change-password" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Change password
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
                                <th>Blood type</th>
                                <th>RH factor</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan="4">No patients yet. Add one to get started.</td>
                                </tr>
                            )}
                            {patients.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.name}</td>
                                    <td>{p.bloodType ?? '—'}</td>
                                    <td>{p.rhFactor ?? '—'}</td>
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
                        <OwnerPatientForm
                            clinicId={clinicId}
                            onSuccess={() => { setShowModal(false); loadPatients(); }}
                            onCancel={() => setShowModal(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicOwnerPatients;
