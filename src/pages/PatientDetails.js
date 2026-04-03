import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatientDetails, addVisit, listBranches, getVisitsByBranch, createPreviousDelivery, updatePreviousDelivery, deletePreviousDelivery } from '../services/api';
import '../styles.css';
import { User, Heart, Calendar, Briefcase, Baby, Plus } from 'lucide-react';
import Swal from 'sweetalert2';

const REASONS_MISS = ['Bleeding', 'Tumor'];
const REASONS_MRS = ['Bleeding', 'Tumor', 'Pregnancy follow-up', 'Postpartum follow-up', 'Infertility follow-up'];
const VISIT_TYPES = ['Checkup', 'Consultation'];

const initialVisitData = {
    clinicBranchId: '',
    date: '',
    notes: '',
    type: 'Checkup',
    reason: '',
    bloodSugar: '',
    bloodPressure: '',
    babyWeight: '',
    babyAgeWeeks: '',
    requiredTests: '',
    previousTestResults: ''
};

const initialPreviousDelivery = {
    deliveryDate: '',
    deliveryType: 'Normal',
    babyGender: '',
    babyWeightAtBirth: '',
    complications: ''
};

const PatientDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [branches, setBranches] = useState([]);
    const [visits, setVisits] = useState([]);
    const [showVisitForm, setShowVisitForm] = useState(false);
    const [visitData, setVisitData] = useState(initialVisitData);
    const [showPreviousDeliveryModal, setShowPreviousDeliveryModal] = useState(false);
    const [previousDeliveryForm, setPreviousDeliveryForm] = useState(initialPreviousDelivery);
    const [editingDeliveryId, setEditingDeliveryId] = useState(null);
    const [editingDeliveryRecord, setEditingDeliveryRecord] = useState(null);
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

    const reasons = data && data.title === 'Mrs' ? REASONS_MRS : REASONS_MISS;

    const handleVisitSubmit = async (e) => {
        e.preventDefault();
        if (!visitData.clinicBranchId || !visitData.date) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Branch and date are required' });
            return;
        }
        if (!visitData.reason) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Reason is required' });
            return;
        }
        try {
            const payload = {
                patientId: id,
                clinicBranchId: Number(visitData.clinicBranchId),
                date: visitData.date,
                notes: visitData.notes.trim() || null,
                type: visitData.type || null,
                reason: visitData.reason || null,
                bloodSugar: visitData.bloodSugar?.trim() || null,
                bloodPressure: visitData.bloodPressure?.trim() || null,
                babyWeight: visitData.babyWeight?.trim() || null,
                babyAgeWeeks: visitData.babyAgeWeeks !== '' ? Number(visitData.babyAgeWeeks) : null,
                requiredTests: visitData.requiredTests?.trim() || null,
                previousTestResults: visitData.previousTestResults?.trim() || null
            };
            await addVisit(payload);
            Swal.fire({ icon: 'success', title: 'Visit added!', showConfirmButton: false, timer: 1500 });
            setShowVisitForm(false);
            setVisitData(initialVisitData);
            fetchDetails();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Failed', text: err.response?.data?.message || 'Could not record visit.' });
        }
    };

    const deliveryHistories = data && (data.DeliveryHistories || data.deliveryHistories || []);
    const previousDeliveries = data && (data.PreviousDeliveries || data.previousDeliveries || []);
    const husband = data && (data.HusbandInfo ?? data.husbandInfo);

    const openAddPreviousDelivery = () => {
        setEditingDeliveryId(null);
        setEditingDeliveryRecord(null);
        setPreviousDeliveryForm(initialPreviousDelivery);
        setShowPreviousDeliveryModal(true);
    };

    const openEditPreviousDelivery = (d) => {
        setEditingDeliveryId(d.id);
        setEditingDeliveryRecord(d);
        setPreviousDeliveryForm({
            deliveryDate: d.deliveryDate ? d.deliveryDate.slice(0, 10) : '',
            deliveryType: d.deliveryType || 'Normal',
            babyGender: d.babyGender || '',
            babyWeightAtBirth: d.babyWeightAtBirth || '',
            complications: d.complications || ''
        });
        setShowPreviousDeliveryModal(true);
    };

    const handlePreviousDeliverySubmit = async (e) => {
        e.preventDefault();
        try {
            const today = new Date().toISOString().slice(0, 10);
            if (editingDeliveryId) {
                await updatePreviousDelivery(editingDeliveryId, previousDeliveryForm);
                Swal.fire({ icon: 'success', title: 'Updated', showConfirmButton: false, timer: 1500 });
            } else {
                await createPreviousDelivery({
                    patientId: id,
                    ...previousDeliveryForm,
                    dateOfEntry: today
                });
                Swal.fire({ icon: 'success', title: 'Previous delivery added', showConfirmButton: false, timer: 1500 });
            }
            setShowPreviousDeliveryModal(false);
            setPreviousDeliveryForm(initialPreviousDelivery);
            setEditingDeliveryId(null);
            fetchDetails();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save.' });
        }
    };

    const handleDeletePreviousDelivery = async (deliveryId) => {
        const result = await Swal.fire({
            title: 'Delete this record?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete'
        });
        if (!result.isConfirmed) return;
        try {
            await deletePreviousDelivery(deliveryId);
            Swal.fire({ icon: 'success', title: 'Deleted', showConfirmButton: false, timer: 1500 });
            fetchDetails();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to delete.' });
        }
    };

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

            <div className="card patient-detail-card">
                <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User size={28} /> {data.name}
                    {data.title && <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#1e3a8a' }}>({data.title})</span>}
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                    <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={16} /> Age: {data.age ?? '—'}
                    </p>
                    <p style={{ margin: 0, color: '#1e3a8a' }}>Blood type: {data.bloodType ?? '—'}</p>
                    <p style={{ margin: 0, color: '#1e3a8a' }}>RH factor: {data.rhFactor ?? '—'}</p>
                    <p style={{ margin: 0, color: '#1e3a8a' }}>Contact: {data.contactInfo ?? '—'}</p>
                </div>
                {data.chronicIllnessesOrFamilyHistory && (
                    <p style={{ margin: '12px 0 0 0', color: '#1e3a8a' }}>Chronic illnesses / family history: {data.chronicIllnessesOrFamilyHistory}</p>
                )}
                {husband && (
                    <div className="husband-info-card">
                        <h4 className="husband-info-title"><Briefcase size={16} /> Husband information</h4>
                        <div className="husband-info-grid">
                            <div className="husband-info-item">
                                <span className="husband-info-label">Husband name</span>
                                <span className="husband-info-value">{husband.name ?? '—'}</span>
                            </div>
                            <div className="husband-info-item">
                                <span className="husband-info-label">Job</span>
                                <span className="husband-info-value">{husband.job ?? '—'}</span>
                            </div>
                            <div className="husband-info-item">
                                <span className="husband-info-label">Phone</span>
                                <span className="husband-info-value">{husband.phone ?? '—'}</span>
                            </div>
                            <div className="husband-info-item">
                                <span className="husband-info-label">Blood type</span>
                                <span className="husband-info-value">{husband.bloodType ?? '—'}</span>
                            </div>
                            <div className="husband-info-item">
                                <span className="husband-info-label">RH factor</span>
                                <span className="husband-info-value">{husband.rhFactor ?? '—'}</span>
                            </div>
                            <div className="husband-info-item">
                                <span className="husband-info-label">Marriage duration</span>
                                <span className="husband-info-value">{husband.marriageDuration ?? '—'}</span>
                            </div>
                            {husband.marriageDate && (
                                <div className="husband-info-item">
                                    <span className="husband-info-label">Marriage date</span>
                                    <span className="husband-info-value">{new Date(husband.marriageDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="husband-info-item husband-info-item--full">
                                <span className="husband-info-label">Semen analysis result</span>
                                <span className="husband-info-value">{husband.semenAnalysisResult ?? '—'}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => setShowVisitForm(true)}>+ Add visit</button>
                    <button type="button" className="btn btn-secondary" onClick={openAddPreviousDelivery} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Baby size={18} /> Add Previous Delivery
                    </button>
                </div>
            </div>

            {/* Previous Deliveries modal */}
            {showPreviousDeliveryModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingDeliveryId ? 'Edit' : 'Add'} Previous Delivery</h2>
                            <button className="close-modal" onClick={() => { setShowPreviousDeliveryModal(false); setEditingDeliveryId(null); }}>×</button>
                        </div>
                        <form onSubmit={handlePreviousDeliverySubmit}>
                            <div className="input-group">
                                <label>Date of entry</label>
                                <input
                                    type="date"
                                    readOnly
                                    value={editingDeliveryId && editingDeliveryRecord?.dateOfEntry ? editingDeliveryRecord.dateOfEntry.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                                />
                                <small style={{ color: '#64748b' }}>Set automatically to today when adding.</small>
                            </div>
                            <div className="input-group">
                                <label>Delivery date</label>
                                <input
                                    type="date"
                                    value={previousDeliveryForm.deliveryDate}
                                    onChange={(e) => setPreviousDeliveryForm({ ...previousDeliveryForm, deliveryDate: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Delivery type</label>
                                <select
                                    value={previousDeliveryForm.deliveryType}
                                    onChange={(e) => setPreviousDeliveryForm({ ...previousDeliveryForm, deliveryType: e.target.value })}
                                >
                                    <option value="Normal">Normal</option>
                                    <option value="Cesarean">Cesarean</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Baby gender</label>
                                <select
                                    value={previousDeliveryForm.babyGender}
                                    onChange={(e) => setPreviousDeliveryForm({ ...previousDeliveryForm, babyGender: e.target.value })}
                                >
                                    <option value="">—</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label>Baby weight at birth</label>
                                <input
                                    type="text"
                                    value={previousDeliveryForm.babyWeightAtBirth}
                                    onChange={(e) => setPreviousDeliveryForm({ ...previousDeliveryForm, babyWeightAtBirth: e.target.value })}
                                    placeholder="e.g. 3.2 kg"
                                />
                            </div>
                            <div className="input-group">
                                <label>Complications</label>
                                <textarea
                                    rows={2}
                                    value={previousDeliveryForm.complications}
                                    onChange={(e) => setPreviousDeliveryForm({ ...previousDeliveryForm, complications: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">{editingDeliveryId ? 'Update' : 'Add'}</button>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowPreviousDeliveryModal(false); setEditingDeliveryId(null); }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showVisitForm && (
                <div className="form-container" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Record new visit</h3>
                    <form onSubmit={handleVisitSubmit}>
                        <div className="input-group">
                            <label>Visit type</label>
                            <select
                                value={visitData.type}
                                onChange={(e) => setVisitData({ ...visitData, type: e.target.value })}
                            >
                                {VISIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Reason *</label>
                            <select
                                required
                                value={visitData.reason}
                                onChange={(e) => setVisitData({ ...visitData, reason: e.target.value })}
                            >
                                <option value="">Select reason</option>
                                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
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
                        <div className="visit-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            <div className="input-group">
                                <label>Blood sugar</label>
                                <input
                                    type="text"
                                    value={visitData.bloodSugar}
                                    onChange={(e) => setVisitData({ ...visitData, bloodSugar: e.target.value })}
                                    placeholder="e.g. 95 mg/dL"
                                />
                            </div>
                            <div className="input-group">
                                <label>Blood pressure</label>
                                <input
                                    type="text"
                                    value={visitData.bloodPressure}
                                    onChange={(e) => setVisitData({ ...visitData, bloodPressure: e.target.value })}
                                    placeholder="e.g. 120/80"
                                />
                            </div>
                            <div className="input-group">
                                <label>Baby weight</label>
                                <input
                                    type="text"
                                    value={visitData.babyWeight}
                                    onChange={(e) => setVisitData({ ...visitData, babyWeight: e.target.value })}
                                    placeholder="e.g. 3.2 kg"
                                />
                            </div>
                            <div className="input-group">
                                <label>Baby age (weeks)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={visitData.babyAgeWeeks}
                                    onChange={(e) => setVisitData({ ...visitData, babyAgeWeeks: e.target.value })}
                                    placeholder="e.g. 28"
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Required tests (تحاليل مطلوبه)</label>
                            <textarea
                                rows={2}
                                value={visitData.requiredTests}
                                onChange={(e) => setVisitData({ ...visitData, requiredTests: e.target.value })}
                                placeholder="تحاليل مطلوبه"
                            />
                        </div>
                        <div className="input-group">
                            <label>Previous test results (نتيجه التحاليل السابقه)</label>
                            <textarea
                                rows={2}
                                value={visitData.previousTestResults}
                                onChange={(e) => setVisitData({ ...visitData, previousTestResults: e.target.value })}
                                placeholder="نتيجه التحاليل السابقه"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                            <button type="submit" className="btn btn-primary">Save visit</button>
                            <button type="button" className="btn btn-secondary" onClick={() => { setShowVisitForm(false); setVisitData(initialVisitData); }}>Cancel</button>
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
                            <th>Type</th>
                            <th>Reason</th>
                            <th>Branch</th>
                            <th>Blood sugar</th>
                            <th>Blood pressure</th>
                            <th>Baby weight</th>
                            <th>Baby age (wks)</th>
                            <th>Required tests</th>
                            <th>Previous results</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visits.length === 0 && (
                            <tr><td colSpan="11">No visits yet.</td></tr>
                        )}
                        {visits.map((v) => (
                            <tr key={v.id}>
                                <td>{v.date ? new Date(v.date).toLocaleDateString() : '—'}</td>
                                <td>{v.type ?? '—'}</td>
                                <td>{v.reason ?? '—'}</td>
                                <td>{v.ClinicBranch ? v.ClinicBranch.name : v.clinicBranchId}</td>
                                <td>{v.bloodSugar || '—'}</td>
                                <td>{v.bloodPressure || '—'}</td>
                                <td>{v.babyWeight || '—'}</td>
                                <td>{v.babyAgeWeeks != null ? v.babyAgeWeeks : '—'}</td>
                                <td>{v.requiredTests ? (v.requiredTests.length > 30 ? v.requiredTests.slice(0, 30) + '…' : v.requiredTests) : '—'}</td>
                                <td>{v.previousTestResults ? (v.previousTestResults.length > 30 ? v.previousTestResults.slice(0, 30) + '…' : v.previousTestResults) : '—'}</td>
                                <td>{v.notes || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Previous Deliveries (new table) */}
            <div className="table-container" style={{ marginTop: '1.5rem' }}>
                <h3 className="table-section-header" style={{ marginTop: 0 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Baby size={20} /> Previous Deliveries</span>
                    <button type="button" className="btn btn-primary" style={{ marginLeft: 'auto', padding: '4px 12px', fontSize: '0.9rem' }} onClick={openAddPreviousDelivery}>
                        <Plus size={16} /> Add
                    </button>
                </h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date of entry</th>
                            <th>Delivery date</th>
                            <th>Type</th>
                            <th>Baby gender</th>
                            <th>Baby weight at birth</th>
                            <th>Complications</th>
                            <th>Recorded by</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {previousDeliveries.length === 0 && (
                            <tr><td colSpan="8">No previous deliveries. Click &quot;Add Previous Delivery&quot; to add one.</td></tr>
                        )}
                        {previousDeliveries.map((d) => (
                            <tr key={d.id}>
                                <td>{d.dateOfEntry ? new Date(d.dateOfEntry).toLocaleDateString() : '—'}</td>
                                <td>{d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString() : '—'}</td>
                                <td>{d.deliveryType ?? '—'}</td>
                                <td>{d.babyGender ?? '—'}</td>
                                <td>{d.babyWeightAtBirth ?? '—'}</td>
                                <td>{d.complications ?? '—'}</td>
                                <td>{(d.Creator && d.Creator.name) || '—'}</td>
                                <td>
                                    <button type="button" className="btn btn-secondary" style={{ marginRight: '4px', padding: '4px 8px' }} onClick={() => openEditPreviousDelivery(d)}>Edit</button>
                                    <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => handleDeletePreviousDelivery(d.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {deliveryHistories.length > 0 && (
                <div className="table-container" style={{ marginTop: '1.5rem' }}>
                    <h3><Heart size={20} /> Delivery history (legacy)</h3>
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
