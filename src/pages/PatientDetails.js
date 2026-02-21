import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPatientDetails, addVisit } from '../services/api';
import '../styles.css';
import { User, Heart, Calendar, Briefcase, Activity } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';

const PatientDetails = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitData, setVisitData] = useState({
    visitType: 'Examination',
    clinicName: '',
    reasonForVisit: 'Antinatal',
    weight: '',
    bloodPressure: '',
    bloodSugar: '',
    gestationalWeek: '',
    fetalWeight: '',
    fetalSize: '',
    requiredTests: '',
    prescribedMedications: '',
    notes: '',
    otherObservations: ''
  });

  // Pregnancy modal & form
  const [showPregnancyModal, setShowPregnancyModal] = useState(false);
  const [pregnancies, setPregnancies] = useState([]);
  const [pregnancyForm, setPregnancyForm] = useState({
    deliveryDate: '',
    gestationalWeeks: '',
    birthWeight: '',
    birthType: 'Normal',
    notes: ''
  });
  const [editingPregnancyId, setEditingPregnancyId] = useState(null);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      const res = await getPatientDetails(id);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Could not load patient details.' });
    }
  };

  // ---------------- Visits ----------------
  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    try {
      await addVisit({ ...visitData, patientId: id });
      Swal.fire({
        icon: 'success',
        title: 'Visit Added!',
        text: 'The patient visit has been recorded successfully.',
        timer: 2000,
        showConfirmButton: false
      });
      setShowVisitForm(false);
      setVisitData({
        visitType: 'Examination',
        clinicName: '',
        reasonForVisit: 'Antinatal',
        weight: '',
        bloodPressure: '',
        bloodSugar: '',
        gestationalWeek: '',
        fetalWeight: '',
        fetalSize: '',
        requiredTests: '',
        prescribedMedications: '',
        notes: '',
        otherObservations: ''
      });
      fetchDetails();
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed!', text: error.response?.data?.message || 'Could not record the visit.' });
    }
  };

  // ---------------- Pregnancies ----------------
  const fetchPregnancies = async () => {
    try {
      const res = await axios.get(`/api/pregnancies/${id}`);
      setPregnancies(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePregnancySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPregnancyId) {
        await axios.put(`/api/pregnancies/${editingPregnancyId}`, pregnancyForm);
        Swal.fire('Updated!', 'Pregnancy record updated', 'success');
      } else {
        await axios.post('/api/pregnancies', { ...pregnancyForm, patientId: id });
        Swal.fire('Added!', 'Pregnancy record added', 'success');
      }
      setPregnancyForm({ deliveryDate: '', gestationalWeeks: '', birthWeight: '', birthType: 'Normal', notes: '' });
      setEditingPregnancyId(null);
      fetchPregnancies();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleEditPregnancy = (preg) => {
    setPregnancyForm({
      deliveryDate: preg.deliveryDate.split('T')[0],
      gestationalWeeks: preg.gestationalWeeks,
      birthWeight: preg.birthWeight,
      birthType: preg.birthType,
      notes: preg.notes
    });
    setEditingPregnancyId(preg.id);
  };

  const handleDeletePregnancy = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    await axios.delete(`/api/pregnancies/${id}`);
    fetchPregnancies();
  };

  if (!data) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      {/* Patient Card */}
      <div className="card" style={{
        padding: '25px',
        marginBottom: '25px',
        borderRadius: '15px',
        background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '15px', width: '100%', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User size={28} /> {data.name}
          </h2>

          {/* Grid for main info */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', flex: 1 }}>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Age: {data.age}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={16} /> Marital: {data.maritalStatus}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Heart size={16} /> Blood: {data.bloodType} {data.rhFactor}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Clinic: {data.clinicLocation}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>Activity: {data.reasonForVisit}</p>
            {data.maritalStatus === 'Madam' && (
              <>
                <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><User size={16} /> Husband: {data.husbandName}</p>
                <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={16} /> Job: {data.husbandJob}</p>
                <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}><Calendar size={16} /> Marriage: {data.marriageDate}</p>
              </>
            )}
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>Chronic: {data.chronicDiseases || 'None'}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>Family History: {data.familyHistory || 'None'}</p>
            <p style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '6px' }}>Notes: {data.otherNotes || 'None'}</p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
            {data.maritalStatus === 'Madam' && (
              <button className="btn btn-info" onClick={() => { fetchPregnancies(); setShowPregnancyModal(true); }}>View Previous Pregnancies & Births</button>
            )}
            <button className="btn btn-success" onClick={() => setShowVisitForm(true)}>+ Add New Visit</button>
          </div>
        </div>
      </div>

      {/* Visit Form */}
      {showVisitForm && (
        <div className="form-container">
          <h3 style={{ marginTop: 0, color: '#1e3a8a' }}>Record New Visit</h3>
          <form onSubmit={handleVisitSubmit} className="form-grid">
            <select value={visitData.visitType} onChange={e => setVisitData({ ...visitData, visitType: e.target.value })}>
              <option value="Examination">Examination (كشف)</option>
              <option value="Consultation">Consultation (استشارة)</option>
            </select>
            <select value={visitData.clinicName} onChange={e => setVisitData({ ...visitData, clinicName: e.target.value })} required>
              <option value="">Select Clinic</option>
              <option value="Al Sayeda Zainab">Al Sayeda Zainab</option>
              <option value="Giza">Giza</option>
            </select>
            <select value={visitData.reasonForVisit} onChange={e => setVisitData({ ...visitData, reasonForVisit: e.target.value })} required>
              <option value="Antinatal">Antinatal (متابعة حمل)</option>
              <option value="Postnatal">Postnatal</option>
              <option value="Virgin">Virgin</option>
              <option value="Other">Other</option>
              <option value="Tumor">Tumor (ورم)</option>
              <option value="Bleeding">Bleeding (نزيف)</option>
            </select>
            <input type="text" placeholder="Blood Pressure" value={visitData.bloodPressure} onChange={e => setVisitData({ ...visitData, bloodPressure: e.target.value })} />
            <input type="text" placeholder="Blood Sugar" value={visitData.bloodSugar} onChange={e => setVisitData({ ...visitData, bloodSugar: e.target.value })} />
            <input type="number" placeholder="Weight (kg)" value={visitData.weight} onChange={e => setVisitData({ ...visitData, weight: e.target.value })} />
            {visitData.reasonForVisit === 'Antinatal' && (
              <>
                <input type="number" placeholder="Gestational Week" value={visitData.gestationalWeek} onChange={e => setVisitData({ ...visitData, gestationalWeek: e.target.value })} />
                <input type="number" placeholder="Fetal Weight" value={visitData.fetalWeight} onChange={e => setVisitData({ ...visitData, fetalWeight: e.target.value })} />
                <input type="text" placeholder="Fetal Size" value={visitData.fetalSize} onChange={e => setVisitData({ ...visitData, fetalSize: e.target.value })} />
              </>
            )}
            <textarea placeholder="Required Tests" rows="2" value={visitData.requiredTests} onChange={e => setVisitData({ ...visitData, requiredTests: e.target.value })} />
            <textarea placeholder="Prescribed Medications" rows="2" value={visitData.prescribedMedications} onChange={e => setVisitData({ ...visitData, prescribedMedications: e.target.value })} />
            <textarea placeholder="Notes" rows="2" value={visitData.notes} onChange={e => setVisitData({ ...visitData, notes: e.target.value })} />
            <textarea placeholder="Other Observations" rows="2" value={visitData.otherObservations} onChange={e => setVisitData({ ...visitData, otherObservations: e.target.value })} />
            <div className="action-row">
              <button type="submit" className="btn btn-primary">Save Record</button>
              <button type="button" onClick={() => setShowVisitForm(false)} className="btn btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Visits Table */}
      <div className="table-container">
        <div style={{ padding: '1rem', backgroundColor: '#f8fafc', fontWeight: 'bold', borderBottom: '1px solid #e2e8f0' }}>Visit History</div>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Type</th><th>Clinic</th><th>Reason</th><th>B.P</th><th>Blood Sugar</th><th>Weight</th><th>Gest. Week</th><th>Fetal Weight</th><th>Fetal Size</th><th>Tests</th><th>Medications</th><th>Notes</th><th>Other Obs.</th>
            </tr>
          </thead>
          <tbody>
            {data.Visits.map((visit) => (
              <tr key={visit.id}>
                <td>{new Date(visit.visitDate).toLocaleDateString()}</td>
                <td>{visit.visitType}</td>
                <td>{visit.clinicName}</td>
                <td style={{ color: '#2563eb', fontWeight: '500' }}>{visit.reasonForVisit}</td>
                <td>{visit.bloodPressure}</td>
                <td>{visit.bloodSugar}</td>
                <td>{visit.weight}</td>
                <td>{visit.gestationalWeek || '-'}</td>
                <td>{visit.fetalWeight || '-'}</td>
                <td>{visit.fetalSize || '-'}</td>
                <td>{visit.requiredTests || '-'}</td>
                <td>{visit.prescribedMedications || '-'}</td>
                <td>{visit.notes || '-'}</td>
                <td>{visit.otherObservations || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

  {/* Pregnancy Section */}
<div className="pregnancy-section" id="pregnancy-section">
  <h3>Previous Pregnancies & Births</h3>

  <div className="pregnancy-table-container">
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Gest. Weeks</th>
          <th>Birth Weight</th>
          <th>Type</th>
          <th>Notes</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {pregnancies.map(p => (
          <tr key={p.id}>
            <td>{new Date(p.deliveryDate).toLocaleDateString()}</td>
            <td>{p.gestationalWeeks}</td>
            <td>{p.birthWeight}</td>
            <td>{p.birthType}</td>
            <td>{p.notes}</td>
            <td>
              <button className="btn-edit" onClick={() => handleEditPregnancy(p)}>Edit</button>
              <button className="btn-delete" onClick={() => handleDeletePregnancy(p.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <div className="pregnancy-form-container">
    <h4>{editingPregnancyId ? 'Edit' : 'Add New'} Pregnancy</h4>
    <form onSubmit={handlePregnancySubmit}>
      <input type="date" value={pregnancyForm.deliveryDate} onChange={e => setPregnancyForm({ ...pregnancyForm, deliveryDate: e.target.value })} required />
      <input type="number" placeholder="Gestational Weeks" value={pregnancyForm.gestationalWeeks} onChange={e => setPregnancyForm({ ...pregnancyForm, gestationalWeeks: e.target.value })} />
      <input type="number" placeholder="Birth Weight" value={pregnancyForm.birthWeight} onChange={e => setPregnancyForm({ ...pregnancyForm, birthWeight: e.target.value })} />
      <select value={pregnancyForm.birthType} onChange={e => setPregnancyForm({ ...pregnancyForm, birthType: e.target.value })}>
        <option value="Normal">Normal</option>
        <option value="C-Section">C-Section</option>
        <option value="Other">Other</option>
      </select>
      <textarea placeholder="Notes" value={pregnancyForm.notes} onChange={e => setPregnancyForm({ ...pregnancyForm, notes: e.target.value })} />
      <div className="form-actions">
        <button type="submit" className="btn-add">{editingPregnancyId ? 'Update' : 'Add'}</button>
 <button 
  type="button" 
  className="btn-cancel" 
  onClick={() => { 
    setEditingPregnancyId(null); 
    setPregnancyForm({ 
      deliveryDate: '', 
      gestationalWeeks: '', 
      birthWeight: '', 
      birthType: 'Normal', 
      notes: '' 
    }); 
  }}
>
  Cancel
</button>

      </div>
    </form>
  </div>
</div>

    </div>
  );
};

export default PatientDetails;
