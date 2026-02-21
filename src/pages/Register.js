import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { register } from '../services/api';
import '../styles.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        clinicId: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.clinicId?.trim()) {
            await Swal.fire({
                icon: 'warning',
                title: 'Clinic ID Required',
                text: 'Please enter your clinic ID to register.'
            });
            return;
        }
        setLoading(true);
        try {
            await register(formData);
            await Swal.fire({
                icon: 'success',
                title: 'Registration Submitted',
                text: 'Your request is pending approval. You will be notified once Admin or Clinic Owner approves your account.',
                confirmButtonText: 'OK'
            });
            navigate('/login');
        } catch (err) {
            setLoading(false);
            const msg = err.response?.data?.message || err.message || 'Registration failed.';
            await Swal.fire({
                icon: 'error',
                title: 'Registration Failed',
                text: msg
            });
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Create Account</h2>
                    <p>Register with your Clinic ID (obtain from your clinic owner)</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Clinic ID</label>
                        <input
                            type="text"
                            placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            required
                            value={formData.clinicId}
                            onChange={(e) => setFormData({ ...formData, clinicId: e.target.value.trim() })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Full Name</label>
                        <input
                            type="text"
                            placeholder="Dr. Mohamed Allam"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="doctor@example.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Submitting...' : 'Register'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Already have an account? <Link to="/login">Login here</Link></p>
                    <p><Link to="/">Back to Home</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register;
