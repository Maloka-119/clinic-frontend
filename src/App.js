import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ChangePassword from './pages/ChangePassword';
import PatientDetails from './pages/PatientDetails';
import AdminDashboard from './pages/AdminDashboard';
import ClinicOwnerDashboard from './pages/ClinicOwnerDashboard';
import ClinicOwnerPatients from './pages/ClinicOwnerPatients';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

const AdminOnly = ({ children }) => {
    const role = localStorage.getItem('userRole');
    if (role !== 'ADMIN') return <Navigate to="/" replace />; // صححنا "Admin" -> "ADMIN"
    return children;
};

const ClinicOwnerOnly = ({ children }) => {
    const role = localStorage.getItem('userRole');
    if (role !== 'OWNER') return <Navigate to="/" replace />; // "ClinicOwner" -> "OWNER"
    return children;
};

function App() {
    return (
        <Router>
            <div className="App">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/change-password" element={
                        <ProtectedRoute><ChangePassword /></ProtectedRoute>
                    } />

                    <Route path="/admin" element={
                        <ProtectedRoute><AdminOnly><AdminDashboard /></AdminOnly></ProtectedRoute>
                    } />
                    <Route path="/clinic-owner" element={
                        <ProtectedRoute><ClinicOwnerOnly><ClinicOwnerDashboard /></ClinicOwnerOnly></ProtectedRoute>
                    } />
                    <Route path="/clinic-owner/patients" element={
                        <ProtectedRoute><ClinicOwnerOnly><ClinicOwnerPatients /></ClinicOwnerOnly></ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute><Dashboard /></ProtectedRoute>
                    } />
                    <Route path="/patient/:id" element={
                        <ProtectedRoute><PatientDetails /></ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
