import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { createPatient, addVisit, listBranches, listEmployees } from '../services/api';
import '../styles.css';

const REASONS_MISS = ['Bleeding', 'Tumor'];
const REASONS_MRS = ['Bleeding', 'Tumor', 'Pregnancy follow-up', 'Postpartum follow-up', 'Infertility follow-up'];
const VISIT_TYPES = ['Checkup', 'Consultation'];
const BLOOD_TYPES = ['A', 'B', 'AB', 'O'];
const RH_OPTIONS = ['+', '-'];

const getUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id ?? null;
    } catch {
        return null;
    }
};

const initialHusband = {
    name: '',
    job: '',
    marriageDuration: '',
    semenAnalysisResult: '',
    bloodType: '',
    rhFactor: ''
};
const initialVisit = {
    date: '',
    clinicBranchId: '',
    employeeId: '',
    notes: '',
    type: 'Checkup',
    reason: ''
};

export default function OwnerPatientForm({ clinicId, onSuccess, onCancel }) {
    const userId = getUserId();
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [age, setAge] = useState('');
    const [bloodType, setBloodType] = useState('');
    const [rhFactor, setRhFactor] = useState('');
    const [chronicIllnessesOrFamilyHistory, setChronicIllnessesOrFamilyHistory] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [husband, setHusband] = useState(initialHusband);
    const [includeHusband, setIncludeHusband] = useState(false);
    const [includeFirstVisit, setIncludeFirstVisit] = useState(false);
    const [visit, setVisit] = useState(initialVisit);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const isMrs = title === 'Mrs';
    const reasons = title === 'Mrs' ? REASONS_MRS : title === 'Miss' ? REASONS_MISS : [];

    useEffect(() => {
        if (!clinicId) return;
        listBranches(clinicId).then((res) => setBranches(Array.isArray(res.data) ? res.data : [])).catch(() => {});
        listEmployees(clinicId).then((res) => setEmployees(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    }, [clinicId]);

    useEffect(() => {
        if (!isMrs) setIncludeHusband(false);
    }, [isMrs]);

    const updateHusband = (field, value) => setHusband((prev) => ({ ...prev, [field]: value }));
    const updateVisit = (field, value) => setVisit((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please select Mrs or Miss.' });
            return;
        }
        if (!name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Patient name is required' });
            return;
        }
        if (!clinicId) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'No clinic assigned' });
            return;
        }
        if (includeFirstVisit && !visit.reason) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Visit reason is required when including first visit.' });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: name.trim(),
                age: age ? Number(age) : null,
                contactInfo: contactInfo.trim() || null,
                clinicId,
                title: title || null,
                bloodType: bloodType || null,
                rhFactor: rhFactor || null,
                chronicIllnessesOrFamilyHistory: chronicIllnessesOrFamilyHistory.trim() || null
            };
            if (isMrs && includeHusband && husband.name.trim()) {
                payload.husband = {
                    name: husband.name.trim(),
                    job: husband.job.trim() || null,
                    marriageDuration: husband.marriageDuration.trim() || null,
                    semenAnalysisResult: husband.semenAnalysisResult.trim() || null,
                    bloodType: husband.bloodType || null,
                    rhFactor: husband.rhFactor || null
                };
            }
            const res = await createPatient(payload);
            const patientId = res.data?.id;
            if (patientId && includeFirstVisit && visit.date && visit.clinicBranchId && visit.reason) {
                await addVisit({
                    patientId,
                    clinicBranchId: Number(visit.clinicBranchId),
                    employeeId: visit.employeeId ? Number(visit.employeeId) : userId,
                    date: visit.date,
                    notes: visit.notes.trim() || null,
                    type: visit.type || null,
                    reason: visit.reason || null
                });
            }
            Swal.fire({ icon: 'success', title: 'Patient added', showConfirmButton: false, timer: 1500 });
            onSuccess && onSuccess();
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to add patient'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="form-section">
                <h3>Patient type</h3>
                <div className="input-group">
                    <label>Is the patient Mrs or Miss? *</label>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="radio" name="title" value="Mrs" checked={title === 'Mrs'} onChange={() => setTitle('Mrs')} />
                            Mrs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input type="radio" name="title" value="Miss" checked={title === 'Miss'} onChange={() => setTitle('Miss')} />
                            Miss
                        </label>
                    </div>
                </div>
            </div>

            <div className="input-group">
                <label>Name *</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            </div>
            <div className="input-group">
                <label>Age</label>
                <input type="number" min="0" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
            <div className="input-group">
                <label>Blood type</label>
                <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                    <option value="">—</option>
                    {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
            </div>
            <div className="input-group">
                <label>RH factor</label>
                <select value={rhFactor} onChange={(e) => setRhFactor(e.target.value)}>
                    <option value="">—</option>
                    {RH_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div className="input-group">
                <label>Chronic illnesses or family history</label>
                <textarea rows={2} value={chronicIllnessesOrFamilyHistory} onChange={(e) => setChronicIllnessesOrFamilyHistory(e.target.value)} />
            </div>
            <div className="input-group">
                <label>Contact info</label>
                <input type="text" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} placeholder="Phone or email" />
            </div>

            {isMrs && (
                <>
                    <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: '600', color: '#334155' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={includeHusband} onChange={(e) => setIncludeHusband(e.target.checked)} />
                            Husband info (if applicable)
                        </label>
                    </div>
                    {includeHusband && (
                        <>
                            <div className="input-group">
                                <label>Husband name</label>
                                <input type="text" value={husband.name} onChange={(e) => updateHusband('name', e.target.value)} placeholder="Full name" />
                            </div>
                            <div className="input-group">
                                <label>Husband job</label>
                                <input type="text" value={husband.job} onChange={(e) => updateHusband('job', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Marriage duration</label>
                                <input type="text" value={husband.marriageDuration} onChange={(e) => updateHusband('marriageDuration', e.target.value)} placeholder="e.g. 5 years" />
                            </div>
                            <div className="input-group">
                                <label>Semen analysis</label>
                                <textarea rows={2} value={husband.semenAnalysisResult} onChange={(e) => updateHusband('semenAnalysisResult', e.target.value)} />
                            </div>
                            <div className="input-group">
                                <label>Blood type</label>
                                <select value={husband.bloodType} onChange={(e) => updateHusband('bloodType', e.target.value)}>
                                    <option value="">—</option>
                                    {BLOOD_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>RH factor</label>
                                <select value={husband.rhFactor} onChange={(e) => updateHusband('rhFactor', e.target.value)}>
                                    <option value="">—</option>
                                    {RH_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </>
                    )}
                </>
            )}

            <div className="form-section" style={{ marginTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={includeFirstVisit} onChange={(e) => setIncludeFirstVisit(e.target.checked)} />
                    Include first visit
                </label>
                {includeFirstVisit && (
                    <>
                        <div className="input-group">
                            <label>Visit type</label>
                            <select value={visit.type} onChange={(e) => updateVisit('type', e.target.value)}>
                                {VISIT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Reason *</label>
                            <select value={visit.reason} onChange={(e) => updateVisit('reason', e.target.value)} required>
                                <option value="">Select reason</option>
                                {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Visit date</label>
                            <input type="date" value={visit.date} onChange={(e) => updateVisit('date', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Branch</label>
                            <select value={visit.clinicBranchId} onChange={(e) => updateVisit('clinicBranchId', e.target.value)}>
                                <option value="">Select branch</option>
                                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} {b.address ? `(${b.address})` : ''}</option>)}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Employee assigned</label>
                            <select value={visit.employeeId} onChange={(e) => updateVisit('employeeId', e.target.value)}>
                                <option value="">— Default —</option>
                                {employees.filter((emp) => emp.role === 'EMPLOYEE' || emp.role === 'OWNER').map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Notes</label>
                            <textarea rows={2} value={visit.notes} onChange={(e) => updateVisit('notes', e.target.value)} />
                        </div>
                    </>
                )}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Add Patient'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}
