import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterManager.css';

// --- Icons ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.38A2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
);
const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

/* ─── Nav items ─── */
const NAV = [
    { key: 'roster', icon: '🗂️', label: 'Manager Roster', desc: 'View and manage all Garbage Managers' },
    { key: 'add', icon: '➕', label: 'Register Manager', desc: 'Add a new Garbage Manager account' },
];

const RegisterManager = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState('roster');
    const [managers, setManagers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [managerToDelete, setManagerToDelete] = useState(null);
    const [alertConfig, setAlertConfig] = useState({ show: false, message: '', type: '' });
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', contactNumber: '', address: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            if (user.role !== 'Admin') { navigate('/'); } else { setCurrentUser(user); }
        } else { navigate('/login'); }
    }, [navigate]);

    const fetchManagers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5000/api/auth/managers');
            const data = await res.json();
            setManagers(data.managers || []);
        } catch { setManagers([]); }
        setLoading(false);
    }, []);

    useEffect(() => { if (currentUser) fetchManagers(); }, [currentUser, fetchManagers]);

    const showAlert = (message, type = 'error') => {
        setAlertConfig({ show: true, message, type });
        setTimeout(() => setAlertConfig({ show: false, message: '', type: '' }), 3500);
    };

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) { showAlert('Passwords do not match'); return; }
        try {
            const res = await fetch('http://localhost:5000/api/auth/register-manager', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, registeredBy: currentUser.id })
            });
            const data = await res.json();
            if (res.ok) {
                showAlert(`"${formData.fullName}" registered successfully!`, 'success');
                setFormData({ fullName: '', email: '', password: '', confirmPassword: '', contactNumber: '', address: '' });
                fetchManagers();
                setView('roster');
            } else { showAlert(data.message || 'Registration failed'); }
        } catch { showAlert('Failed to connect to the server.'); }
    };

    const handleDelete = async () => {
        if (!managerToDelete) return;
        try {
            const res = await fetch(`http://localhost:5000/api/auth/managers/${managerToDelete}`, { method: 'DELETE' });
            if (res.ok) { fetchManagers(); showAlert('Manager removed.', 'success'); }
            else { showAlert('Failed to remove manager.'); }
        } catch { showAlert('Server error.'); }
        setManagerToDelete(null);
    };

    const activeNav = NAV.find(n => n.key === view);
    const filteredManagers = managers.filter(m =>
        m.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    if (!currentUser) return null;

    return (
        <div className="rm-root">

            {/* ══════════ SIDEBAR ══════════ */}
            <aside className="rm-sidebar">
                <div className="rm-sb-brand">
                    <span className="rm-sb-brand-icon">♻️</span>
                    <div>
                        <div className="rm-sb-brand-title">Manager Hub</div>
                        <div className="rm-sb-brand-sub">Admin Control Panel</div>
                    </div>
                </div>

                <div className="rm-sb-nav-label">Navigation</div>
                <nav className="rm-sb-nav">
                    {NAV.map(n => (
                        <button
                            key={n.key}
                            className={`rm-sb-nav-item ${view === n.key ? 'rm-sb-active' : ''}`}
                            onClick={() => setView(n.key)}
                        >
                            <span className="rm-sb-nav-icon">{n.icon}</span>
                            <div className="rm-sb-nav-text">
                                <span className="rm-sb-nav-lbl">{n.label}</span>
                                <span className="rm-sb-nav-desc">{n.desc}</span>
                            </div>
                            {view === n.key && <span className="rm-sb-active-dot" />}
                        </button>
                    ))}
                </nav>

                <div className="rm-sb-divider" />

                <div className="rm-sb-nav-label">Summary</div>
                <div className="rm-sb-stats">
                    {[
                        { val: managers.length, label: 'Total Managers', color: '#a3d2ab' },
                        { val: managers.filter(m => m.address).length, label: 'With Zone', color: '#34d399' },
                        { val: managers.filter(m => m.contactNumber).length, label: 'With Contact', color: '#60a5fa' },
                    ].map(s => (
                        <div key={s.label} className="rm-sb-stat-row">
                            <span className="rm-sb-stat-dot" style={{ background: s.color, boxShadow: `0 0 0 3px ${s.color}30` }} />
                            <span className="rm-sb-stat-label">{s.label}</span>
                            <span className="rm-sb-stat-val">{s.val}</span>
                        </div>
                    ))}
                </div>

                <div className="rm-sb-spacer" />
                <button className="rm-sb-register-btn" onClick={() => setView('add')}>
                    <span>＋</span> Register Manager
                </button>
            </aside>

            {/* ══════════ MAIN AREA ══════════ */}
            <main className="rm-main">

                {/* Topbar */}
                <header className="rm-topbar">
                    <div className="rm-topbar-left">
                        <span className="rm-topbar-icon">{activeNav.icon}</span>
                        <div>
                            <h1 className="rm-topbar-title">{activeNav.label}</h1>
                            <p className="rm-topbar-sub">{activeNav.desc}</p>
                        </div>
                    </div>
                    <div className="rm-topbar-right">
                        <span className="rm-kpi rm-kpi-green">♻️ {managers.length} Managers</span>
                    </div>
                </header>

                {/* Alert */}
                {alertConfig.show && (
                    <div className={`rm-inline-alert rm-alert-${alertConfig.type}`}>
                        {alertConfig.message}
                    </div>
                )}

                <div className="rm-content">

                    {/* ══ ROSTER VIEW ══ */}
                    {view === 'roster' && (
                        <div className="rm-panel animate-fade-in">
                            <div className="rm-panel-header">
                                <h2>Registered Garbage Managers</h2>
                                <div className="rm-search-bar">
                                    <SearchIcon />
                                    <input
                                        type="text"
                                        placeholder="Search by name or email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="rm-panel-content custom-scrollbar">
                                {loading ? (
                                    <div className="rm-empty-state"><p>Loading managers...</p></div>
                                ) : filteredManagers.length === 0 ? (
                                    <div className="rm-empty-state">
                                        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>♻️</div>
                                        <p>{searchQuery ? 'No managers matched your search.' : 'No Garbage Managers registered yet.'}</p>
                                        <button className="rm-sb-register-btn" style={{ marginTop: '16px' }} onClick={() => setView('add')}>
                                            + Register First Manager
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rm-manager-grid">
                                        {filteredManagers.map(m => (
                                            <div key={m.id} className="rm-manager-card">
                                                <div className="rm-card-top">
                                                    <div className="rm-manager-avatar">{getInitials(m.fullName)}</div>
                                                    <div className="rm-manager-info">
                                                        <h4>{m.fullName}</h4>
                                                        <span className="rm-role-badge">Garbage Manager</span>
                                                    </div>
                                                    <button
                                                        className="rm-btn-delete"
                                                        onClick={() => setManagerToDelete(m.id)}
                                                        title="Remove Manager"
                                                    >
                                                        <TrashIcon />
                                                    </button>
                                                </div>

                                                <div className="rm-card-details">
                                                    <div className="rm-detail-row">
                                                        <MailIcon />
                                                        <span>{m.email}</span>
                                                    </div>
                                                    {m.contactNumber && (
                                                        <div className="rm-detail-row">
                                                            <PhoneIcon />
                                                            <span>{m.contactNumber}</span>
                                                        </div>
                                                    )}
                                                    {m.address && (
                                                        <div className="rm-detail-row">
                                                            <MapPinIcon />
                                                            <span>{m.address}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="rm-card-footer">
                                                    <span className="rm-joined-date">
                                                        Registered: {new Date(m.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ ADD MANAGER VIEW ══ */}
                    {view === 'add' && (
                        <div className="rm-panel animate-fade-in">
                            <div className="rm-panel-header">
                                <h2>Register New Garbage Manager</h2>
                            </div>
                            <div className="rm-panel-content custom-scrollbar" style={{ padding: '32px 40px' }}>
                                <form className="rm-form" onSubmit={handleSubmit}>
                                    <div className="rm-form-grid">
                                        <div className="rm-form-group">
                                            <label>Full Name <span className="req">*</span></label>
                                            <input type="text" name="fullName" placeholder="e.g. Kamal Perera"
                                                value={formData.fullName} onChange={handleChange} required />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Email Address <span className="req">*</span></label>
                                            <input type="email" name="email" placeholder="manager@ecomanage.com"
                                                value={formData.email} onChange={handleChange} required />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Password <span className="req">*</span></label>
                                            <input type="password" name="password" placeholder="••••••••"
                                                value={formData.password} onChange={handleChange} required />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Confirm Password <span className="req">*</span></label>
                                            <input type="password" name="confirmPassword" placeholder="••••••••"
                                                value={formData.confirmPassword} onChange={handleChange} required />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Contact Number</label>
                                            <input type="tel" name="contactNumber" placeholder="+94 77 123 4567"
                                                value={formData.contactNumber} onChange={handleChange} />
                                        </div>
                                        <div className="rm-form-group">
                                            <label>Assigned Zone / Area</label>
                                            <input type="text" name="address" placeholder="e.g. Colombo 03 Zone"
                                                value={formData.address} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div className="rm-form-actions">
                                        <button type="button" className="rm-btn-ghost" onClick={() => setView('roster')}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="rm-btn-solid">
                                            ✓ Register Manager
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirm Modal */}
            {managerToDelete && (
                <div className="rm-modal-backdrop" onClick={() => setManagerToDelete(null)}>
                    <div className="rm-modal-box" onClick={e => e.stopPropagation()}>
                        <div className="rm-modal-icon">⚠️</div>
                        <h3>Remove Manager</h3>
                        <p>Are you sure you want to remove this Garbage Manager? This action cannot be undone.</p>
                        <div className="rm-modal-actions">
                            <button className="rm-btn-ghost" onClick={() => setManagerToDelete(null)}>Cancel</button>
                            <button className="rm-btn-danger" onClick={handleDelete}>Remove</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegisterManager;
