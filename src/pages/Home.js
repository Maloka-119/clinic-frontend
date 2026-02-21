import React from 'react';
import { Link } from 'react-router-dom';
import '../styles.css';

const Home = () => {
    return (
        <div className="auth-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
                <div className="auth-header">
                    <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Clinic Management System</h1>
                    <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                        Manage patients, visits, and clinic operations with role-based access. 
                        Register with your clinic ID or log in if you already have an account.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link to="/login" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                        Login
                    </Link>
                    <Link to="/register" className="btn btn-secondary" style={{ padding: '12px 24px' }}>
                        Register
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home;
