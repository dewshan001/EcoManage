import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Login/Login.css'; // Reusing the authentication base styles

const PASSWORD_RULE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const FULL_NAME_RULE = /^[\p{L} ]+$/u;

const validateForm = (data) => {
    const errors = {};
    const normalizedFullName = (data.fullName || '').trim();
    const normalizedEmail = (data.email || '').trim().toLowerCase();

    if (!normalizedFullName) {
        errors.fullName = 'Full name is required.';
    } else if (!FULL_NAME_RULE.test(normalizedFullName)) {
        errors.fullName = 'Full name can contain only letters and spaces.';
    }

    if (normalizedEmail && !normalizedEmail.endsWith('@gmail.com')) {
        errors.email = 'Email must be a @gmail.com address.';
    }

    if (data.password && !PASSWORD_RULE.test(data.password)) {
        errors.password = 'Password must be at least 8 characters and include 1 uppercase letter and 1 symbol.';
    }

    if (data.confirmPassword && data.password !== data.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match.';
    }

    return errors;
};

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();

    const showAlert = (message, type = 'error') => {
        setAlertConfig({ show: true, message, type });
        // Auto-hide alert after 3 seconds
        setTimeout(() => {
            setAlertConfig({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleChange = (e) => {
        const updatedFormData = {
            ...formData,
            [e.target.name]: e.target.value
        };
        setFormData(updatedFormData);
        setFieldErrors(validateForm(updatedFormData));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = validateForm(formData);
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            showAlert('Please fix the highlighted fields.');
            return;
        }

        const normalizedFullName = formData.fullName.trim();
        const normalizedEmail = formData.email.trim().toLowerCase();

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fullName: normalizedFullName,
                    email: normalizedEmail,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Registration successful! Redirecting...', 'success');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            } else {
                showAlert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Failed to connect to the server.');
        }
    };

    return (
        <div className="auth-page">
            <div
                className="auth-bg"
                style={{ backgroundImage: `url(https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2000&auto=format&fit=crop)` }} /* Using a sapling/nature image */
            />

            <div className="auth-container">
                <div className="auth-glass-panel animate-fade-in-up">
                    <div className="auth-header">
                        <h2>Join EcoManage</h2>
                        <p>Create an account to participate in community care.</p>
                    </div>

                    {alertConfig.show && (
                        <div className={`auth-alert auth-alert-${alertConfig.type}`}>
                            {alertConfig.message}
                        </div>
                    )}

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                placeholder="Your Name"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.fullName && <small className="auth-field-warning">{fieldErrors.fullName}</small>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="you@gmail.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.email && <small className="auth-field-warning">{fieldErrors.email}</small>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.password && <small className="auth-field-warning">{fieldErrors.password}</small>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />
                            {fieldErrors.confirmPassword && <small className="auth-field-warning">{fieldErrors.confirmPassword}</small>}
                        </div>

                        <button type="submit" className="btn-primary auth-submit">
                            Create Account
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Sign in here</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
