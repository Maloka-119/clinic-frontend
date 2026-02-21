import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { login } from '../services/api';
import '../styles.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

 const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await login({ email, password });
        const { token, user } = res.data;

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('doctorName', user.name || '');

        await Swal.fire({
            icon: 'success',
            title: `Welcome back, ${user.name}!`,
            showConfirmButton: false,
            timer: 1200
        });

        // التوجيه حسب role
    switch (user.role) {
    case 'ADMIN':
        navigate('/admin');
        break;
    case 'OWNER':
        navigate('/clinic-owner');
        break;
    case 'EMPLOYEE':
        navigate('/dashboard');
        break;
    case 'PATIENT':
        navigate('/patient-dashboard'); // لو عندك dashboard للمرضى
        break;
    default:
        navigate('/dashboard');
}

    } catch (err) {
        setLoading(false);
        const msg = err.response?.data?.message || err.message || 'Invalid email or password';
        await Swal.fire({ icon: 'error', title: 'Login Failed', text: msg });
    }
};

    return (
        <div className="auth-wrapper">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Welcome Back</h2>
                    <p>Clinic Management System</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            placeholder="doctor@example.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>
                <div className="auth-footer">
                    <p>Don't have an account? <Link to="/register">Register here</Link></p>
                    <p><Link to="/">Back to Home</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;