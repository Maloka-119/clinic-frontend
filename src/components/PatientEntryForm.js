import React, { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import {
    listClinics,
    listBranches,
    listEmployees,
    createPatient,
    addVisit
} from '../services/api';
import '../styles.css';

const REASONS_MISS = ['Bleeding', 'Tumor'];
const REASONS_MRS = ['Bleeding', 'Tumor', 'Pregnancy follow-up', 'Postpartum follow-up', 'Infertility follow-up'];
const VISIT_TYPES = ['Checkup', 'Consultation'];
const BLOOD_TYPES = ['A', 'B', 'AB', 'O'];
const RH_OPTIONS = ['+', '-'];

const getClinicId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.clinicId ?? null;
    } catch {
        return null;
    }
};

const getUserId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.id ?? null;
    } catch {
        return null;
    }
};

const initialBasic = {
    name: '',
    age: '',
    bloodType: '',
    rhFactor: '',
    chronicIllnessesOrFamilyHistory: '',
    contactInfo: '',
    clinicId: '',
    clinicBranchId: ''
};
const initialVisit = {
    date: '',
    employeeId: '',
    notes: '',
    clinicBranchId: '',
    type: 'Checkup',
    reason: ''
};
const initialHusband = {
    name: '',
    job: '',
    marriageDuration: '',
    semenAnalysisResult: '',
    bloodType: '',
    rhFactor: ''
};

export default function PatientEntryForm({ onSuccess, onCancel, isOwner }) {
    const userClinicId = getClinicId();
    const userId = getUserId();

    const [clinics, setClinics] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [title, setTitle] = useState(''); // 'Mrs' | 'Miss'
    const [basic, setBasic] = useState(initialBasic);
    const [visit, setVisit] = useState(initialVisit);
    const [husband, setHusband] = useState(initialHusband);
    const [includeFirstVisit, setIncludeFirstVisit] = useState(false);
    const [includeHusband, setIncludeHusband] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const effectiveClinicId = isOwner ? (basic.clinicId ? Number(basic.clinicId) : null) : userClinicId;
    const reasons = title === 'Mrs' ? REASONS_MRS : title === 'Miss' ? REASONS_MISS : [];
    const isMrs = title === 'Mrs';

    useEffect(() => {
        if (isOwner) {
            listClinics()
                .then((res) => setClinics(Array.isArray(res.data) ? res.data : []))
                .catch(() => {});
        }
    }, [isOwner]);

    useEffect(() => {
        if (!effectiveClinicId) {
            setBranches([]);
            setEmployees([]);
            return;
        }
        listBranches(effectiveClinicId).then((res) => setBranches(Array.isArray(res.data) ? res.data : [])).catch(() => {});
        listEmployees(effectiveClinicId).then((res) => setEmployees(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    }, [effectiveClinicId]);

    useEffect(() => {
        if (!isMrs) setIncludeHusband(false);
    }, [isMrs]);

    const updateBasic = (field, value) => setBasic((p) => ({ ...p, [field]: value }));
    const updateVisit = (field, value) => setVisit((p) => ({ ...p, [field]: value }));
    const updateHusband = (field, value) => setHusband((p) => ({ ...p, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Please select Mrs or Miss.' });
            return;
        }
        const cId = isOwner ? basic.clinicId : userClinicId;
        if (!cId) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Clinic is required.' });
            return;
        }
        if (!basic.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Patient name is required.' });
            return;
        }
        if (includeFirstVisit && !visit.reason) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Visit reason is required when including first visit.' });
            return;
        }
        setSubmitting(true);
        try {
            const payload = {
                name: basic.name.trim(),
                age: basic.age ? Number(basic.age) : null,
                contactInfo: basic.contactInfo.trim() || null,
                clinicId: Number(cId),
                title: title || null,
                bloodType: basic.bloodType || null,
                rhFactor: basic.rhFactor || null,
                chronicIllnessesOrFamilyHistory: basic.chronicIllnessesOrFamilyHistory.trim() || null
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
            const visitBranchId = visit.clinicBranchId || basic.clinicBranchId;
            if (patientId && includeFirstVisit && visit.date && visitBranchId && visit.reason) {
                const branchId = Number(visitBranchId);
                const empId = visit.employeeId ? Number(visit.employeeId) : userId;
                if (branchId && empId) {
                    await addVisit({
                        patientId,
                        clinicBranchId: branchId,
                        employeeId: empId,
                        date: visit.date,
                        notes: visit.notes.trim() || null,
                        type: visit.type || null,
                        reason: visit.reason || null
                    });
                }
            }
            Swal.fire({ icon: 'success', title: 'Patient saved', text: 'Patient and optional visit recorded.', showConfirmButton: false, timer: 2000 });
            onSuccess && onSuccess();
            onCancel && onCancel();
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to save patient.' });
        } finally {
            setSubmitting(false);
        }
    };

    const visitBranches = branches;

    return (
        <form onSubmit={handleSubmit} className="patient-entry-form">
            {/* Mrs / Miss */}
            <section className="form-section">
                <h3>Patient type</h3>
                <div className="input-group">
                    <label>Is the patient Mrs or Miss? *</label>
                    <div style={{ display: 'flex', gap: '1.5rem', marginTop: '6px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="title"
                                value="Mrs"
                                checked={title === 'Mrs'}
                                onChange={() => setTitle('Mrs')}
                            />
                            Mrs
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name="title"
                                value="Miss"
                                checked={title === 'Miss'}
                                onChange={() => setTitle('Miss')}
                            />
                            Miss
                        </label>
                    </div>
                </div>
            </section>

            {/* Common patient info */}
            <section className="form-section">
                <h3>Basic patient info</h3>
                <div className="input-group">
                    <label>Name *</label>
                    <input type="text" required value={basic.name} onChange={(e) => updateBasic('name', e.target.value)} placeholder="Full name" />
                </div>
                <div className="input-group">
                    <label>Age</label>
                    <input type="number" min="0" value={basic.age} onChange={(e) => updateBasic('age', e.target.value)} />
                </div>
                <div className="input-group">
                    <label>Blood type</label>
                    <select value={basic.bloodType} onChange={(e) => updateBasic('bloodType', e.target.value)}>
                        <option value="">—</option>
                        {BLOOD_TYPES.map((b) => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label>RH factor</label>
                    <select value={basic.rhFactor} onChange={(e) => updateBasic('rhFactor', e.target.value)}>
                        <option value="">—</option>
                        {RH_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
                <div className="input-group">
                    <label>Chronic illnesses or family history</label>
                    <textarea rows={2} value={basic.chronicIllnessesOrFamilyHistory} onChange={(e) => updateBasic('chronicIllnessesOrFamilyHistory', e.target.value)} placeholder="Optional" />
                </div>
                <div className="input-group">
                    <label>Contact info</label>
                    <input type="text" value={basic.contactInfo} onChange={(e) => updateBasic('contactInfo', e.target.value)} placeholder="Phone or email" />
                </div>
                {isOwner && (
                    <>
                        <div className="input-group">
                            <label>Assigned clinic *</label>
                            <select required value={basic.clinicId} onChange={(e) => { updateBasic('clinicId', e.target.value); updateBasic('clinicBranchId', ''); }}>
                                <option value="">Select clinic</option>
                                {clinics.map((c) => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Branch</label>
                            <select value={basic.clinicBranchId} onChange={(e) => updateBasic('clinicBranchId', e.target.value)}>
                                <option value="">Select branch</option>
                                {branches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name} {b.address ? `(${b.address})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                {!isOwner && (
                    <div className="input-group">
                        <label>Branch</label>
                        <select value={basic.clinicBranchId} onChange={(e) => updateBasic('clinicBranchId', e.target.value)}>
                            <option value="">Select branch</option>
                            {branches.map((b) => (
                                <option key={b.id} value={b.id}>{b.name} {b.address ? `(${b.address})` : ''}</option>
                            ))}
                        </select>
                    </div>
                )}
            </section>

            {/* Husband info (Mrs only) */}
            {isMrs && (
                <section className="form-section">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <input type="checkbox" checked={includeHusband} onChange={(e) => setIncludeHusband(e.target.checked)} />
                        Husband info (if applicable)
                    </label>
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
                                    {BLOOD_TYPES.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="input-group">
                                <label>RH factor</label>
                                <select value={husband.rhFactor} onChange={(e) => updateHusband('rhFactor', e.target.value)}>
                                    <option value="">—</option>
                                    {RH_OPTIONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}
                </section>
            )}

            {/* First visit */}
            <section className="form-section">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={includeFirstVisit} onChange={(e) => setIncludeFirstVisit(e.target.checked)} />
                    Include first visit
                </label>
                {includeFirstVisit && (
                    <>
                        <div className="input-group">
                            <label>Visit type</label>
                            <select value={visit.type} onChange={(e) => updateVisit('type', e.target.value)}>
                                {VISIT_TYPES.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Reason *</label>
                            <select value={visit.reason} onChange={(e) => updateVisit('reason', e.target.value)} required={includeFirstVisit}>
                                <option value="">Select reason</option>
                                {reasons.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Visit date</label>
                            <input type="date" value={visit.date} onChange={(e) => updateVisit('date', e.target.value)} />
                        </div>
                        <div className="input-group">
                            <label>Branch</label>
                            <select value={visit.clinicBranchId || basic.clinicBranchId} onChange={(e) => updateVisit('clinicBranchId', e.target.value)}>
                                <option value="">Select branch</option>
                                {visitBranches.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="input-group">
                            <label>Employee assigned</label>
                            <select value={visit.employeeId} onChange={(e) => updateVisit('employeeId', e.target.value)}>
                                <option value="">— Me / default —</option>
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
            </section>

            <div style={{ display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : 'Save patient'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
            </div>
        </form>
    );
}
