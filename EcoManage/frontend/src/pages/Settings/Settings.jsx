import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '',
        password: '',
        confirmPassword: ''
    });
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();

    // Check auth status on mount
    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            // Pre-fill full name
            setFormData(prev => ({
                ...prev,
                fullName: parsedUser.fullName || ''
            }));
        } else {
            // Redirect to login if not authenticated
            navigate('/login');
        }
    }, [navigate]);

    const showAlert = (message, type = 'error') => {
        setAlertConfig({ show: true, message, type });
        setTimeout(() => {
            setAlertConfig({ show: false, message: '', type: '' });
        }, 3000);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password && formData.password !== formData.confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }

        try {
            const payload = {
                userId: user.id,
                fullName: formData.fullName
            };

            // Only send password if user inputted a new one
            if (formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch('http://localhost:5000/api/auth/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showAlert('Profile updated successfully!', 'success');

                alert('Settings updated successfully!');

                // Update session storage
                sessionStorage.setItem('user', JSON.stringify(data.user));
                setUser(data.user); // Keep this line to update the component's state

                // Optional: dispatch event to update global state if necessary
                window.dispatchEvent(new Event('user-updated'));
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    password: '',
                    confirmPassword: ''
                }));
            } else {
                showAlert(data.message || 'Update failed');
            }
        } catch (error) {
            console.error('Settings update error:', error);
            showAlert('Failed to connect to the server.');
        }
    };

    if (!user) return null; // Wait for redirect if not logged in

    return (
        <div className="settings-page">
            <div className="settings-container">
                <div className="settings-glass-panel">
                    <div className="settings-header">
                        <h2>Account Settings</h2>
                        <p>Update your profile information and password.</p>
                    </div>

                    {alertConfig.show && (
                        <div className={`settings-alert settings-alert-${alertConfig.type}`}>
                            {alertConfig.message}
                        </div>
                    )}

                    <form className="settings-form" onSubmit={handleSubmit}>
                        <div className="settings-group">
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
                        </div>

                        {/* Visual separator for password fields */}
                        <div className="settings-password-section">
                            <h3>Change Password</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: '-15px' }}>
                                Leave blank to keep your current password.
                            </p>

                            <div className="settings-group">
                                <label htmlFor="password">New Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="settings-group">
                                <label htmlFor="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <button type="submit" className="btn-primary settings-submit">
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Settings;
