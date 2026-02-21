import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatientDetails, addVisit, listBranches, getVisitsByBranch } from '../services/api';
import '../styles.css';
import { User, Heart, Calendar, Briefcase } from 'lucide-react';
import Swal from 'sweetalert2';

const PatientDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [branches, setBranches] = useState([]);
    const [visits, setVisits] = useState([]);
    const [showVisitForm, setShowVisitForm] = useState(false);
    const [visitData, setVisitData] = useState({ clinicBranchId: '', date: '', notes: '' });
    const [loading, setLoading] = useState(true);

    const fetchDetails = async () => {
        try {
            const res = await getPatientDetails(id);
            const patient = res.data;
            setData(patient);
            if (patient && patient.clinicId) {
                const brRes = await listBranches(patient.clinicId);
                setBranches(Array.isArray(brRes.data) ? brRes.data : []);
                const branchIds = (brRes.data || []).map((b) => b.id);
                const allVisits = [];
                for (const bid of branchIds) {
                    try {
                        const vRes = await getVisitsByBranch(bid);
                        const list = Array.isArray(vRes.data) ? vRes.data : [];
                        allVisits.push(...list.filter((v) => Number(v.patientId) === Number(id)));
                    } catch (_) {}
                }
                allVisits.sort((a, b) => new Date(b.date) - new Date(a.date));
                setVisits(allVisits);
            }
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Could not load patient details.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!visitData.clinicBranchId || !visitData.date) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Branch and date are required' });
            return;
        }
        try {
            await addVisit({
                patientId: id,
                clinicBranchId: Number(visitData.clinicBranchId),
                date: visitData.date,
                notes: visitData.notes.trim() || null
            });
            Swal.fire({ icon: 'success', title: 'Visit added!', showConfirmButton: false, timer: 1500 });
            setShowVisitForm(false);
            setVisitData({ clinicBranchId: '', date: '', notes: '' });
            fetchDetails();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not record visit.' });
        }
    };

    const deliveryHistories = data && (data.DeliveryHistories || data.deliveryHistories || []);
    const husband = data && (data.HusbandInfo || data.husbandInfo);

    if (loading && !data) return <div className="container">Loading...</div>;
    if (!data) return <div className="container"><p>Patient not found.</p><Link to="/dashboard">Back to Dashboard</Link></div>;

    return (
        <div className="container">
            <div style={{ marginBottom: '1rem' }}>
                {(function () {
                    const role = JSON.parse(localStorage.getItem('user') || '{}').role;
                    if (role === 'OWNER') return <Link to="/clinic-owner/patients" style={{ color: '#2563eb' }}>← Back to Patients</Link>;
                    return <Link to="/dashboard" style={{ color: '#2563eb' }}>← Back to Dashboard</Link>;
                })()}
            </div>

            <div
                className="card"
                style={{
                    padding: '25px',
                    marginBottom: '25px',
                    borderRadius: '15px',
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                }}
            >
                <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={28} /> {data.name}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> Age: {data.age ?? '—'}
                    </p>
                    <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Gender: {data.gender ?? '—'}
                    </p>
                    <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Contact: {data.contactInfo ?? '—'}
                    </p>
                </div>
                {husband && (
                    <div style={{ marginTop: '1rem', padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 8px 0' }}><Briefcase size={16} /> Husband info</h4>
                        <p style={{ margin: 0 }}>Name: {husband.name}</p>
                        {husband.job && <p style={{ margin: 0 }}>Job: {husband.job}</p>}
                        {husband.phone && <p style={{ margin: 0 }}>Phone: {husband.phone}</p>}
                        {husband.marriageDate && <p style={{ margin: 0 }}>Marriage: {new Date(husband.marriageDate).toLocaleDateString()}</p>}
                    </div>
                )}
                <div style={{ marginTop: '1rem' }}>
                    <button className="btn btn-primary" onClick={() => setShowVisitForm(true)}>+ Add visit</button>
                </div>
            </div>

            {showVisitForm && (
                <div className="form-container" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Record new visit</h3>
                    <form onSubmit={handleVisitSubmit}>
                        <div className="input-group">
                            <label>Branch</label>
                            <select
                                required
                                value={visitData.clinicBranchId}
                                onChange={(e) => setVisitData({ ...visitData, clinicBranchId: e.target.value })}
                            >
                                <option value="">Select branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} {b.address ? `(${b.address})` : ''}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Date</label>
                            <input
                                type="date"
                                required
                                value={visitData.date}
                                onChange={(e) => setVisitData({ ...visitData, date: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Notes</label>
                            <textarea
                                rows={3}
                                value={visitData.notes}
                                onChange={(e) => setVisitData({ ...visitData, notes: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Save visit</button>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowVisitForm(false)}>Cancel</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <h3 style={{ marginTop: 0 }}>Visit history</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Branch</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.length === 0 && (
                            <tr><td colSpan="3">No visits yet.</td></tr>
                        )}
                        {visits.map((v) => (
                            <tr key={v.id}>
                                <td>{v.date ? new Date(v.date).toLocaleDateString() : '—'}</td>
                                <td>{v.ClinicBranch ? v.ClinicBranch.name : v.clinicBranchId}</td>
                                <td>{v.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {deliveryHistories.length > 0 && (
                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                    <h3><Heart size={20} /> Delivery history</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Baby gender</th>
                                <th>Complications</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveryHistories.map((d) => (
                                <tr key={d.id}>
                                    <td>{d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString() : '—'}</td>
                                    <td>{d.deliveryType ?? '—'}</td>
                                    <td>{d.babyGender ?? '—'}</td>
                                    <td>{d.complications ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default PatientDetails;
