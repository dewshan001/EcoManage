import React, { useState, useEffect } from 'react';
import './Reports.css';

// Using simple SVG icons to avoid external dependencies if not present,
// but usually Lucide React is preferred. We'll use inline SVGs for reliability.
const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

const LoaderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spin">
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
        <line x1="2" y1="12" x2="6" y2="12" />
        <line x1="18" y1="12" x2="22" y2="12" />
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
);

const XCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

const Reports = () => {
    // State for the form
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'

    // State for history data
    const [history, setHistory] = useState([]);
    const [reportToDelete, setReportToDelete] = useState(null);

    // Fetch reports from the backend
    const fetchReports = async () => {
        try {
            const userStr = sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userIdQuery = user ? `?userId=${user.id}` : '';

            const response = await fetch(`http://localhost:5000/api/reports${userIdQuery}`);
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            } else {
                console.error('Failed to fetch reports');
            }
        } catch (error) {
            console.error('Error fetching reports:', error);
        }
    };

    // Fetch reports on component mount and when switching to history tab
    useEffect(() => {
        if (activeTab === 'history') {
            fetchReports();
        }
    }, [activeTab]);

    const confirmDeleteReport = async () => {
        if (!reportToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/api/reports/${reportToDelete}`, { method: 'DELETE' });
            if (res.ok) {
                setHistory(prev => prev.filter(r => r.id !== reportToDelete));
            } else {
                alert('Failed to delete report');
            }
        } catch (error) {
            console.error('Error deleting report:', error);
            alert('Failed to delete report');
        } finally {
            setReportToDelete(null);
        }
    };

    // Handle Image upload and preview
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const userStr = sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;

            const response = await fetch('http://localhost:5000/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user ? user.id : null,
                    location,
                    description,
                    imageUrl: imagePreview
                }),
            });

            if (response.ok) {
                // Reset form
                setLocation('');
                setDescription('');
                setImagePreview(null);

                // Switch to history tab to see the new report
                setActiveTab('history');
            } else {
                console.error('Failed to submit report');
                // Could add user-facing error state here
            }
        } catch (error) {
            console.error('Error submitting report:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helpers
    const getStatusConfig = (status) => {
        switch (status) {
            case 'Resolved': return { color: 'resolved', icon: <CheckCircleIcon />, label: 'Completed' };
            case 'Approved': return { color: 'approved', icon: <CheckCircleIcon />, label: 'Approved' };
            case 'In Progress': return { color: 'progress', icon: <LoaderIcon />, label: 'In Progress' };
            case 'In Review': return { color: 'review', icon: <LoaderIcon />, label: 'In Review' };
            case 'Rejected': return { color: 'rejected', icon: <XCircleIcon />, label: 'Rejected' };
            default: return { color: 'pending', icon: <ClockIcon />, label: status || 'Pending' };
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
        <>
        <div className="reports-page-container">
            {/* Background Decorations */}
            <div className="reports-bg-shape shape-1"></div>
            <div className="reports-bg-shape shape-2"></div>
            <div className="reports-bg-shape shape-3"></div>

            <div className="reports-content-wrapper">

                {/* Header Section */}
                <header className="reports-header animate-fade-in-up">
                    <span className="section-tag dark">COMMUNITY WATCH</span>
                    <h1 className="reports-title">Garbage & Eco Reports</h1>
                    <p className="reports-subtitle">
                        Help us maintain a pristine environment. Submit reports of unauthorized dumping,
                        overflowing bins, or ecological hazards for rapid municipal response.
                    </p>
                </header>

                {/* Main Interactive Card */}
                <div className="reports-glass-card animate-fade-in-up delay-100">

                    {/* Tab Navigation */}
                    <div className="reports-tabs">
                        <button
                            className={`tab-btn ${activeTab === 'submit' ? 'active' : ''}`}
                            onClick={() => setActiveTab('submit')}
                        >
                            <span className="tab-icon">🌱</span> Submit New Report
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                            onClick={() => setActiveTab('history')}
                        >
                            <span className="tab-icon">📋</span> Tracking & History
                        </button>
                    </div>

                    <div className="tab-content-area">
                        {/* ─── TAB: SUBMIT NEW REPORT ─── */}
                        {activeTab === 'submit' && (
                            <form className="report-form animate-fade-in" onSubmit={handleSubmit}>

                                <div className="form-grid">
                                    <div className="form-column">

                                        <div className="form-group">
                                            <label htmlFor="location">Issue Location</label>
                                            <div className="input-with-icon">
                                                <div className="input-icon"><MapPinIcon /></div>
                                                <input
                                                    type="text"
                                                    id="location"
                                                    placeholder="e.g., 42 Park Avenue, Colombo 03"
                                                    value={location}
                                                    onChange={(e) => setLocation(e.target.value)}
                                                    required
                                                    className="glass-input"
                                                />
                                            </div>
                                            <span className="field-hint">Be as specific as possible so our field teams can locate it quickly.</span>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="description">Detailed Description</label>
                                            <textarea
                                                id="description"
                                                placeholder="Describe the nature of the garbage or ecological issue..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                required
                                                rows="5"
                                                className="glass-input textarea"
                                            ></textarea>
                                        </div>

                                    </div>

                                    <div className="form-column">
                                        <div className="form-group h-full">
                                            <label>Photo Evidence (Optional, but recommended)</label>
                                            <div className="image-upload-area relative">
                                                <input
                                                    type="file"
                                                    id="imageUpload"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    className="hidden-file-input"
                                                />
                                                {imagePreview ? (
                                                    <div className="image-preview-container">
                                                        <img src={imagePreview} alt="Preview" className="image-preview" />
                                                        <div className="image-preview-overlay">
                                                            <button
                                                                type="button"
                                                                className="btn-change-image"
                                                                onClick={() => document.getElementById('imageUpload').click()}
                                                            >
                                                                Change Photo
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <label htmlFor="imageUpload" className="upload-placeholder">
                                                        <div className="upload-icon-pulse"><CameraIcon /></div>
                                                        <span className="upload-text">Click or drag a photo here</span>
                                                        <span className="upload-subtext">Clear photos help us sort the issue faster</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
                                    <div className="form-guarantee">
                                        <span className="shield-icon">🛡️</span>
                                        Your identity remains anonymous to the public.
                                    </div>
                                    <button
                                        type="submit"
                                        className={`btn-primary submit-btn ${isSubmitting ? 'loading' : ''}`}
                                        disabled={isSubmitting || !location || !description}
                                    >
                                        {isSubmitting ? 'Processing...' : 'Submit to Municipal System'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* ─── TAB: TRACKING & HISTORY ─── */}
                        {activeTab === 'history' && (
                            <div className="history-view animate-fade-in">

                                <div className="history-controls">
                                    <div className="history-search">
                                        <input type="text" placeholder="Search by Complaint ID or Location..." className="glass-input search-input" />
                                    </div>
                                    <div className="history-filter">
                                        <select className="glass-input filter-select">
                                            <option value="all">All Statuses</option>
                                            <option value="pending">Pending</option>
                                            <option value="progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="reports-list">
                                    {history.map((report) => {
                                        const statusConfig = getStatusConfig(report.status);
                                        return (
                                            <div key={report.id} className="report-card">

                                                {/* Left: Image (if any) */}
                                                <div className="report-card-image">
                                                    {report.imageUrl ? (
                                                        <img src={report.imageUrl} alt="Complaint Evidence" />
                                                    ) : (
                                                        <div className="no-image-placeholder"><CameraIcon /></div>
                                                    )}
                                                </div>

                                                {/* Middle: Details */}
                                                <div className="report-card-body">
                                                    <div className="report-card-header">
                                                        <span className="report-id">{report.reportId}</span>
                                                        <span className={`status-badge ${statusConfig.color}`}>
                                                            {statusConfig.icon} {statusConfig.label}
                                                        </span>
                                                    </div>
                                                    <h3 className="report-location">{report.location}</h3>
                                                    <p className="report-desc">{report.description}</p>
                                                    <div className="report-meta">
                                                        <span className="report-date">Reported: {formatDate(report.date)}</span>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="report-card-actions">
                                                    <button className="btn-icon view-btn" title="View Full Details">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                                    </button>
                                                    <button className="btn-icon" title="Delete Report" onClick={() => setReportToDelete(report.id)} style={{ color: '#dc2626' }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {history.length === 0 && (
                                        <div className="empty-state">
                                            <div className="empty-icon">🍃</div>
                                            <h3>No complaints found</h3>
                                            <p>All looks clean and green! Or try adjusting your filters.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

            {/* Delete Report Confirmation Modal */}
            {reportToDelete && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setReportToDelete(null)}>
                    <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <h3 style={{ margin: 0, color: '#dc2626' }}>Delete Report</h3>
                        </div>
                        <p style={{ margin: '0 0 1.5rem', color: 'var(--text-mid, #555)', fontSize: '0.95rem' }}>Are you sure you want to delete this report? This action cannot be undone.</p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                            <button onClick={() => setReportToDelete(null)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color, #ddd)', background: 'transparent', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
                            <button onClick={confirmDeleteReport} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #b91c1c', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Reports;
