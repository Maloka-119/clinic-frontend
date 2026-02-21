import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
    listClinicUsers,
    approveUser,
    rejectUser,
    listBranches,
    createBranch,
    listEmployees,
    createEmployee,
    toggleEmployeeActive
} from '../services/api';
import '../styles.css';

const getClinicId = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.clinicId || null;
    } catch {
        return null;
    }
};

const ClinicOwnerDashboard = () => {
    const navigate = useNavigate();
    const [section, setSection] = useState('overview'); // overview | branches | employees
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [clinicId, setClinicId] = useState(getClinicId());
    const [loading, setLoading] = useState(true);
    const [showBranchModal, setShowBranchModal] = useState(false);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [branchForm, setBranchForm] = useState({ name: '', address: '' });
    const [employeeForm, setEmployeeForm] = useState({ name: '', email: '', password: '', clinicBranchId: '' });
    const doctorName = localStorage.getItem('doctorName') || JSON.parse(localStorage.getItem('user') || '{}').name || 'Clinic Owner';

    const loadBranches = () => {
        if (!clinicId) return;
        listBranches(clinicId)
            .then((res) => setBranches(Array.isArray(res.data) ? res.data : []))
            .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load branches' }));
    };

    const loadEmployees = () => {
        if (!clinicId) return;
        listEmployees(clinicId)
            .then((res) => setEmployees(Array.isArray(res.data) ? res.data : []))
            .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load employees' }));
    };

    const loadUsers = () => {
        if (!clinicId) return;
        listClinicUsers(clinicId)
            .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
            .catch(() => Swal.fire({ icon: 'error', title: 'Error', text: 'Could not load users' }));
    };

    useEffect(() => {
        const cid = getClinicId();
        setClinicId(cid);
        if (cid) {
            loadBranches();
            loadEmployees();
            loadUsers();
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (clinicId) {
            loadBranches();
            loadEmployees();
            loadUsers();
        }
    }, [clinicId]);

    const handleAddBranch = async (e) => {
        e.preventDefault();
        if (!clinicId || !branchForm.name.trim()) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Branch name is required' });
            return;
        }
        try {
            await createBranch({ clinicId, name: branchForm.name.trim(), address: branchForm.address.trim() || null });
            setShowBranchModal(false);
            setBranchForm({ name: '', address: '' });
            loadBranches();
            Swal.fire({ icon: 'success', title: 'Branch added', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to add branch' });
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        if (!clinicId || !employeeForm.email || !employeeForm.password) {
            Swal.fire({ icon: 'warning', title: 'Missing fields', text: 'Email and password are required' });
            return;
        }
        try {
            await createEmployee({
                name: employeeForm.name.trim() || employeeForm.email,
                email: employeeForm.email.trim(),
                password: employeeForm.password,
                clinicId,
                clinicBranchId: employeeForm.clinicBranchId || null
            });
            setShowEmployeeModal(false);
            setEmployeeForm({ name: '', email: '', password: '', clinicBranchId: '' });
            loadEmployees();
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Employee added', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to add employee' });
        }
    };

    const handleToggleEmployee = async (emp, isActive) => {
        const action = isActive ? 'activate' : 'deactivate';
        const { value } = await Swal.fire({
            title: `${action} ${emp.name}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes'
        });
        if (!value) return;
        try {
            await toggleEmployeeActive(emp.id);
            loadEmployees();
            loadUsers();
            Swal.fire({ icon: 'success', title: `Employee ${action}d`, showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleApprove = async (id) => {
        const { value } = await Swal.fire({ title: 'Approve this user?', icon: 'question', showCancelButton: true, confirmButtonText: 'Approve' });
        if (!value) return;
        try {
            await approveUser(id);
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Approved', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleReject = async (id) => {
        const { value } = await Swal.fire({ title: 'Reject this user?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Reject' });
        if (!value) return;
        try {
            await rejectUser(id);
            loadUsers();
            Swal.fire({ icon: 'success', title: 'Rejected', showConfirmButton: false, timer: 1500 });
        } catch (err) {
            Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed' });
        }
    };

    const handleLogout = () => {
        Swal.fire({ title: 'Log out?', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, log out' }).then((result) => {
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

    const pending = users.filter((u) => u.status === 'PENDING');
    const approved = users.filter((u) => u.status === 'APPROVED');

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
                    <Link to="/" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Home
                    </Link>
                    <Link to="/clinic-owner/patients" className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }}>
                        Patients Management
                    </Link>
                    <button className="btn btn-secondary" style={{ background: 'white', color: '#3B82F6' }} onClick={handleLogout}>
                        Log Out
                    </button>
                </div>
            </header>

            <div className="page-header" style={{ marginBottom: '1rem' }}>
                <h1 className="title">Clinic Owner Dashboard</h1>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button
                    className={section === 'overview' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setSection('overview')}
                >
                    Overview
                </button>
                <button
                    className={section === 'branches' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setSection('branches')}
                >
                    Branches
                </button>
                <button
                    className={section === 'employees' ? 'btn btn-primary' : 'btn btn-secondary'}
                    onClick={() => setSection('employees')}
                >
                    Employees
                </button>
            </div>

            {loading && !clinicId ? (
                <p>Loading...</p>
            ) : !clinicId ? (
                <p style={{ color: '#64748b' }}>No clinic assigned. Please contact admin.</p>
            ) : (
                <>
                    {section === 'overview' && (
                        <>
                            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
                                Approve or reject registration requests. Manage branches and employees from the tabs above.
                            </p>
                            <h2 style={{ marginTop: '1rem' }}>Pending requests ({pending.length})</h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pending.length === 0 && (
                                            <tr>
                                                <td colSpan="3">No pending requests</td>
                                            </tr>
                                        )}
                                        {pending.map((u) => (
                                            <tr key={u.id}>
                                                <td>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <button className="btn btn-primary" style={{ marginRight: '4px' }} onClick={() => handleApprove(u.id)}>
                                                        Approve
                                                    </button>
                                                    <button className="btn btn-secondary" onClick={() => handleReject(u.id)}>
                                                        Reject
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <h2 style={{ marginTop: '1.5rem' }}>Approved users ({approved.length})</h2>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {approved.map((u) => (
                                            <tr key={u.id}>
                                                <td>{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>{u.isActive ? 'Active' : 'Inactive'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {section === 'branches' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="title">Branches</h2>
                                <button className="btn btn-primary" onClick={() => setShowBranchModal(true)}>
                                    + Add Branch
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Address</th>
                                            <th>Active</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {branches.length === 0 && (
                                            <tr>
                                                <td colSpan="3">No branches yet. Add one to get started.</td>
                                            </tr>
                                        )}
                                        {branches.map((b) => (
                                            <tr key={b.id}>
                                                <td>{b.name}</td>
                                                <td>{b.address || '—'}</td>
                                                <td>{b.isActive ? 'Yes' : 'No'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {section === 'employees' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h2 className="title">Employees</h2>
                                <button className="btn btn-primary" onClick={() => setShowEmployeeModal(true)}>
                                    + Add Employee
                                </button>
                            </div>
                            <div className="table-container">
                                <table>
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
                                        {employees.filter((e) => e.role === 'EMPLOYEE').map((emp) => (
                                            <tr key={emp.id}>
                                                <td>{emp.name}</td>
                                                <td>{emp.email}</td>
                                                <td>{emp.role}</td>
                                                <td>{emp.isActive ? 'Yes' : 'No'}</td>
                                                <td>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleToggleEmployee(emp, !emp.isActive)}
                                                    >
                                                        {emp.isActive ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {employees.filter((e) => e.role === 'EMPLOYEE').length === 0 && (
                                            <tr>
                                                <td colSpan="5">No employees yet. Add one to get started.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}

            {showBranchModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Branch</h2>
                            <button className="close-modal" onClick={() => setShowBranchModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddBranch}>
                            <div className="input-group">
                                <label>Branch Name</label>
                                <input
                                    type="text"
                                    required
                                    value={branchForm.name}
                                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    value={branchForm.address}
                                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">Add Branch</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowBranchModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEmployeeModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Employee</h2>
                            <button className="close-modal" onClick={() => setShowEmployeeModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddEmployee}>
                            <div className="input-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    value={employeeForm.name}
                                    placeholder="Optional"
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    required
                                    value={employeeForm.email}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    required
                                    value={employeeForm.password}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                                />
                            </div>
                            <div className="input-group">
                                <label>Branch (optional)</label>
                                <select
                                    value={employeeForm.clinicBranchId}
                                    onChange={(e) => setEmployeeForm({ ...employeeForm, clinicBranchId: e.target.value || '' })}
                                >
                                    <option value="">— None —</option>
                                    {branches.map((b) => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                <button type="submit" className="btn btn-primary">Add Employee</button>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEmployeeModal(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicOwnerDashboard;
