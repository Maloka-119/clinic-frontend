import React, { useEffect, useState } from 'react';
import { getPatients, createPatient } from "../services/api";
import { UserPlus, Eye, X, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import '../styles.css';

const Dashboard = () => {
    const navigate = useNavigate();

    // ======== State Variables ========
    const [patients, setPatients] = useState([]);
    const [filteredPatients, setFilteredPatients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [reasonFilter, setReasonFilter] = useState('');
    const [newPatient, setNewPatient] = useState({
        name: '', age: '', phone: '', maritalStatus: 'Madam',
        bloodType: 'A', rhFactor: '+', clinicLocation: 'Giza',
        husbandName: '', husbandJob: '', marriageDate: '',
        reasonForVisit: 'Antinatal', chronicDiseases: '',
        familyHistory: '', otherNotes: ''
    });

     // هنا نجيب اسم اليوزر من localStorage
    const doctorName = localStorage.getItem('doctorName') || 'User';


    // ======== Load Patients ========
    useEffect(() => {
        loadPatients();
    }, []);

    useEffect(() => {
        // Apply Search & Filter
        let filtered = patients;

        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.phone.includes(searchQuery)
            );
        }

        if (reasonFilter !== '') {
            filtered = filtered.filter(p => p.reasonForVisit === reasonFilter);
        }

        setFilteredPatients(filtered);
    }, [searchQuery, reasonFilter, patients]);

    const loadPatients = () => {
        getPatients()
            .then(res => setPatients(res.data.data))
            .catch(err => Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not load patients'
            }));
    };

    // ======== Handle Form Inputs ========
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPatient({ ...newPatient, [name]: value });
    };

    // ======== Add Patient ========
    const handleAddPatient = async (e) => {
        e.preventDefault();
        try {
            await createPatient(newPatient);
            setIsModalOpen(false);
            loadPatients();

            Swal.fire({
                icon: 'success',
                title: 'Patient added successfully!',
                showConfirmButton: false,
                timer: 1500
            });

            setNewPatient({
                name: '', age: '', phone: '', maritalStatus: 'Madam',
                bloodType: 'A', rhFactor: '+', clinicLocation: 'Giza',
                husbandName: '', husbandJob: '', marriageDate: '',
                reasonForVisit: 'Antinatal', chronicDiseases: '',
                familyHistory: '', otherNotes: ''
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not save patient'
            });
        }
    };

    // ======== Log Out ========
    const handleLogout = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You will be logged out!",
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
                Swal.fire({
                    icon: 'success',
                    title: 'Logged Out!',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        })
    };

    return (
        <div className="container">
         {/* Welcome message + Logout */}
<div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '15px 0',
    padding: '15px 20px',
    background: 'linear-gradient(90deg, #6EE7B7, #3B82F6)',
    color: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
    fontWeight: '600',
    fontSize: '1.1rem'
}}>
    <div>
        <span style={{ fontSize: '1.3rem', fontWeight: '700' }}></span>
        <span style={{ marginLeft: '10px' }}>Welcome back, {doctorName}!</span>
    </div>
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
</div>


            {/* ===== Page Header ===== */}
            <div className="page-header">
                <h1 className="title">Patients Dashboard</h1>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <UserPlus size={20} /> Add New Patient
                </button>
            </div>

            {/* ===== Search & Filter ===== */}
            <div style={{ display: 'flex', gap: '10px', margin: '15px 0' }}>
                <input
                    type="text"
                    placeholder="Search by Name or Phone"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ flex: 2, padding: '5px' }}
                />
                <select 
                    value={reasonFilter} 
                    onChange={e => setReasonFilter(e.target.value)} 
                    style={{ flex: 1, padding: '5px' }}
                >
                    <option value="">All Reasons</option>
                    <option value="Antinatal">Antinatal</option>
                    <option value="Postnatal">Postnatal</option>
                    <option value="Virgin">Virgin</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            {/* ===== Modal: Add Patient ===== */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="title">Patient Registration</h2>
                            <button className="close-modal" onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddPatient} className="form-grid">
                            <input type="text" name="name" placeholder="Patient Full Name" required onChange={handleInputChange} />
                            <input type="number" name="age" placeholder="Age" onChange={handleInputChange} />
                            <input type="text" name="phone" placeholder="Phone Number" onChange={handleInputChange} />

                            <select name="maritalStatus" onChange={handleInputChange}>
                                <option value="Madam">Madam (متزوجة)</option>
                                <option value="Miss">Miss (آنسة)</option>
                            </select>

                            <select name="clinicLocation" onChange={handleInputChange}>
                                <option value="Al Sayeda Zainab">Clinic: السيدة زينب</option>
                                <option value="Giza">Clinic: الجيزة</option>
                            </select>

                            <div style={{ display: 'flex', gap: '5px' }}>
                                <select name="bloodType" style={{ flex: 2 }} onChange={handleInputChange}>
                                    <option value="A">Type A</option>
                                    <option value="B">Type B</option>
                                    <option value="AB">Type AB</option>
                                    <option value="O">Type O</option>
                                </select>
                                <select name="rhFactor" style={{ flex: 1 }} onChange={handleInputChange}>
                                    <option value="+">RH+</option>
                                    <option value="-">RH-</option>
                                </select>
                            </div>

                            {newPatient.maritalStatus === 'Madam' && (
                                <>
                                    <input type="text" name="husbandName" placeholder="Husband Name" onChange={handleInputChange} />
                                    <input type="text" name="husbandJob" placeholder="Husband Job" onChange={handleInputChange} />
                                    <input type="date" name="marriageDate" onChange={handleInputChange} />
                                </>
                            )}

                            <select name="reasonForVisit" onChange={handleInputChange}>
                                <option value="Antinatal">Antinatal</option>
                                <option value="Postnatal">Postnatal</option>
                                <option value="Virgin">Virgin</option>
                                <option value="Other">Other</option>
                            </select>

                            <textarea name="chronicDiseases" placeholder="Chronic Diseases" onChange={handleInputChange}></textarea>
                            <textarea name="familyHistory" placeholder="Family Medical History" onChange={handleInputChange}></textarea>
                            <textarea name="otherNotes" placeholder="Other Notes" onChange={handleInputChange}></textarea>

                            <div className="action-row">
                                <button type="submit" className="btn btn-primary">Save Patient</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Patients Table ===== */}
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Clinic</th>
                            <th>Marital Status</th>
                            <th>Blood / RH</th>
                            <th>Reason</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPatients.map(p => (
                            <tr key={p.id}>
                                <td>{p.name}</td>
                                <td>{p.clinicLocation}</td>
                                <td>{p.maritalStatus}</td>
                                <td>{p.bloodType} {p.rhFactor}</td>
                                <td>{p.reasonForVisit}</td>
                                <td>
                                    <Link to={`/patient/${p.id}`} style={{ color: '#2563eb' }}>
                                        <Eye size={20} />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
