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

const Reports = () => {
    // State for the form
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('submit'); // 'submit' | 'history'

    // Mock initial history data
    const [history, setHistory] = useState([
        {
            id: 'REP-10293',
            location: 'Main St & 4th Ave, Colombo 03',
            description: 'Large pile of electronic waste dumped near the park entrance.',
            date: '2026-02-27T10:30:00',
            status: 'In Progress',
            imageUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=400&auto=format&fit=crop'
        },
        {
            id: 'REP-10291',
            location: 'Galle Road, Mount Lavinia',
            description: 'Overflowing public bins by the bus stop.',
            date: '2026-02-25T14:15:00',
            status: 'Resolved',
            imageUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=400&auto=format&fit=crop'
        }
    ]);

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
    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API call delay
        setTimeout(() => {
            const newReport = {
                id: `REP-${Math.floor(10000 + Math.random() * 90000)}`,
                location,
                description,
                date: new Date().toISOString(),
                status: 'Pending',
                imageUrl: imagePreview || null
            };

            setHistory([newReport, ...history]);

            // Reset form
            setLocation('');
            setDescription('');
            setImagePreview(null);
            setIsSubmitting(false);

            // Switch to history tab to see the new report
            setActiveTab('history');
        }, 1200);
    };

    // Helpers
    const getStatusConfig = (status) => {
        switch (status) {
            case 'Resolved': return { color: 'resolved', icon: <CheckCircleIcon /> };
            case 'In Progress': return { color: 'progress', icon: <LoaderIcon /> };
            default: return { color: 'pending', icon: <ClockIcon /> };
        }
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    return (
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
                                                        <span className="report-id">{report.id}</span>
                                                        <span className={`status-badge ${statusConfig.color}`}>
                                                            {statusConfig.icon} {report.status}
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
    );
};

export default Reports;
