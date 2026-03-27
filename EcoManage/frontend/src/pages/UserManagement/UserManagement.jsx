import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserManagement.css';

// --- Icons ---
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);

const API_BASE = 'http://localhost:5000/api/auth';

const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

const validatePassword = (password) => {
    if (!password) return true; // Optional for edit
    return password.length >= 6 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
};

const NAV = [
    { key: 'dashboard', icon: '📊', label: 'User Dashboard', desc: 'Overview of all active users and accounts' },
    { key: 'roster', icon: '👥', label: 'Resident Roster', desc: 'Detailed view of all registered residents' },
];

const UserManagement = () => {
    const navigate = useNavigate();
    const storedUser = useMemo(() => {
        const raw = sessionStorage.getItem('user');
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }, []);

    const isAdmin = storedUser && storedUser.role === 'Admin';
    const [view, setView] = useState('dashboard');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddUser, setShowAddUser] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        if (!storedUser) {
            navigate('/login', { replace: true });
            return;
        }
        if (!isAdmin) {
            navigate('/', { replace: true });
        }
    }, [storedUser, isAdmin, navigate]);

    const fetchUsers = async () => {
        if (!storedUser) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/users?role=Resident&requestedBy=${encodeURIComponent(storedUser.id)}`);
            const text = await response.text();
            const data = text ? (() => { try { return JSON.parse(text); } catch { return null; } })() : null;
            if (response.ok) {
                setUsers(Array.isArray(data?.users) ? data.users : []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) fetchUsers();
    }, [isAdmin]);

    // Modals
    const AddUserModal = ({ onClose, onAdd }) => {
        const [f, setF] = useState({ fullName: '', email: '', password: '', contactNumber: '', address: '' });
        const [error, setError] = useState('');
        const [mLoading, setMLoading] = useState(false);

        const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
        const submit = async e => {
            e.preventDefault();
            if (!validateEmail(f.email)) return setError('Invalid email');
            if (f.password && !validatePassword(f.password)) return setError('Password must be 6+ chars with upper, lower, number');
            setMLoading(true);
            try {
                const response = await fetch(`${API_BASE}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestedBy: storedUser.id,
                        fullName: f.fullName,
                        email: f.email,
                        password: f.password,
                        contactNumber: f.contactNumber || null,
                        address: f.address || null
                    })
                });
                if (response.ok) {
                    onAdd();
                    onClose();
                } else {
                    const data = await response.json();
                    setError(data.message || 'Failed to create');
                }
            } catch (err) {
                setError('Failed to create');
            } finally {
                setMLoading(false);
            }
        };
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <header className="modal-hdr">
                        <span className="modal-icon-wrap">👤</span>
                        <div><h3>Register Resident</h3><p>Add a new resident account</p></div>
                        <button className="modal-x" onClick={onClose} disabled={mLoading}>✕</button>
                    </header>
                    <form className="modal-form" onSubmit={submit}>
                        {error && <div style={{ color: 'red', margin: '5px 0', padding: '10px', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
                        <div className="mf-field"><label>Full Name</label>
                            <input name="fullName" placeholder="John Doe" value={f.fullName} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Email Address</label>
                            <input type="email" name="email" placeholder="john@example.com" value={f.email} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Password</label>
                            <input type="password" name="password" placeholder="Create strong password" value={f.password} onChange={ch} required minLength="6" />
                        </div>
                        <div className="mf-field"><label>Contact (Optional)</label>
                            <input name="contactNumber" placeholder="+1-555-0000" value={f.contactNumber} onChange={ch} />
                        </div>
                        <div className="mf-field"><label>Address (Optional)</label>
                            <input name="address" placeholder="123 Main St" value={f.address} onChange={ch} />
                        </div>
                        <footer className="modal-footer">
                            <button type="button" className="btn-ghost" onClick={onClose} disabled={mLoading}>Cancel</button>
                            <button type="submit" className="btn-solid" disabled={mLoading}>{mLoading ? 'Creating...' : 'Register'}</button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    };

    const EditUserModal = ({ user, onClose, onRefresh }) => {
        const [f, setF] = useState({ fullName: user.fullName, email: user.email, contactNumber: user.contactNumber || '', address: user.address || '' });
        const [error, setError] = useState('');
        const [mLoading, setMLoading] = useState(false);

        const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
        const submit = async e => {
            e.preventDefault();
            if (!validateEmail(f.email)) return setError('Invalid email');
            setMLoading(true);
            try {
                const response = await fetch(`${API_BASE}/users/${user.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestedBy: storedUser.id,
                        fullName: f.fullName,
                        email: f.email,
                        contactNumber: f.contactNumber || null,
                        address: f.address || null
                    })
                });
                if (response.ok) {
                    onRefresh();
                    onClose();
                } else {
                    const data = await response.json();
                    setError(data.message || 'Failed to update');
                }
            } catch (err) {
                setError('Failed to update');
            } finally {
                setMLoading(false);
            }
        };
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <header className="modal-hdr">
                        <span className="modal-icon-wrap" style={{ background: '#e0f2fe', color: '#0284c7' }}>✏️</span>
                        <div><h3>Edit Resident</h3><p>Update resident details</p></div>
                        <button className="modal-x" onClick={onClose} disabled={mLoading}>✕</button>
                    </header>
                    <form className="modal-form" onSubmit={submit}>
                        {error && <div style={{ color: 'red', margin: '5px 0', padding: '10px', background: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
                        <div className="mf-field"><label>Full Name</label>
                            <input name="fullName" value={f.fullName} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Email Address</label>
                            <input type="email" name="email" value={f.email} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Contact (Optional)</label>
                            <input name="contactNumber" value={f.contactNumber} onChange={ch} />
                        </div>
                        <div className="mf-field"><label>Address (Optional)</label>
                            <input name="address" value={f.address} onChange={ch} />
                        </div>
                        <footer className="modal-footer">
                            <button type="button" className="btn-ghost" onClick={onClose} disabled={mLoading}>Cancel</button>
                            <button type="submit" className="btn-solid" disabled={mLoading}>{mLoading ? 'Saving...' : 'Save Changes'}</button>
                        </footer>
                    </form>
                </div>
            </div>
        );
    };

    const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
        if (!isOpen) return null;
        return (
            <div className="modal-backdrop" onClick={onCancel}>
                <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                    <header className="modal-hdr" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                        <span className="modal-icon-wrap" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠️</span>
                        <div><h3 style={{ color: '#dc2626' }}>{title}</h3></div>
                    </header>
                    <div className="modal-body" style={{ padding: '0 24px 24px', color: 'var(--text-mid)', fontSize: '0.95rem' }}>
                        <p>{message}</p>
                    </div>
                    <footer className="modal-footer" style={{ borderTop: 'none', paddingTop: 0 }}>
                        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
                        <button type="button" className="btn-solid" style={{ background: '#dc2626', borderColor: '#b91c1c' }} onClick={onConfirm}>Delete</button>
                    </footer>
                </div>
            </div>
        );
    };

    const deleteUserConfirm = async () => {
        if (userToDelete) {
            try {
                const response = await fetch(`${API_BASE}/users/${userToDelete}?requestedBy=${encodeURIComponent(storedUser.id)}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    setUsers(prev => prev.filter(u => u.id !== userToDelete));
                }
            } catch (error) {
                console.error('Error deleting:', error);
            } finally {
                setUserToDelete(null);
            }
        }
    };

    const activeNav = NAV.find(n => n.key === view) || NAV[0];
    const filteredUsers = users.filter(u => {
        const query = searchQuery.toLowerCase();
        return u.fullName.toLowerCase().includes(query) || u.email.toLowerCase().includes(query) || u.id.toString().includes(query);
    });

    const totalUsers = users.length;

    if (!storedUser || !isAdmin) return null;

    return (
        <div className="um-root">
            {/* SIDEBAR */}
            <aside className="um-sidebar">
                <div className="um-sb-nav-label">Navigation</div>
                <nav className="um-sb-nav">
                    {NAV.map(n => (
                        <button
                            key={n.key}
                            className={`um-sb-nav-item ${view === n.key ? 'um-sb-active' : ''}`}
                            onClick={() => setView(n.key)}
                        >
                            <span className="um-sb-nav-icon">{n.icon}</span>
                            <div className="um-sb-nav-text">
                                <span className="um-sb-nav-lbl">{n.label}</span>
                                <span className="um-sb-nav-desc">{n.desc}</span>
                            </div>
                            {view === n.key && <span className="um-sb-active-dot" />}
                        </button>
                    ))}
                </nav>
                <div className="um-sb-divider" />
                <div className="um-sb-nav-label">System Stats</div>
                <div className="um-sb-stats">
                    <div className="um-sb-stat-row">
                        <span className="um-sb-stat-dot" style={{ background: '#60a5fa', boxShadow: `0 0 0 3px #60a5fa30` }} />
                        <span className="um-sb-stat-label">Total Residents</span>
                        <span className="um-sb-stat-val">{totalUsers}</span>
                    </div>
                </div>
                <div className="um-sb-spacer" />
                <button className="um-sb-register-btn" onClick={() => setShowAddUser(true)}>
                    <span>＋</span> Register Resident
                </button>
            </aside>

            {/* MAIN AREA */}
            <main className="um-main">
                <header className="um-topbar">
                    <div className="um-topbar-left">
                        <span className="um-topbar-icon">{activeNav.icon}</span>
                        <div>
                            <h1 className="um-topbar-title">{activeNav.label}</h1>
                            <p className="um-topbar-sub">{activeNav.desc}</p>
                        </div>
                    </div>
                    <div className="um-topbar-right">
                        <div className="um-kpi-row">
                            <span className="um-kpi" style={{ color: '#1e40af' }}>👥 {totalUsers} Residents Active</span>
                        </div>
                    </div>
                </header>

                <div className="um-content">
                    <div className="um-grid-layout" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="um-panel um-profiles-panel animate-fade-in" style={{ gridColumn: '1 / -1' }}>
                            <div className="um-panel-header">
                                <h2>Resident Directory</h2>
                                <div className="um-controls">
                                    <div className="um-search-bar">
                                        <SearchIcon />
                                        <input
                                            type="text"
                                            placeholder="Search by name, email or ID..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="um-panel-content custom-scrollbar">
                                <div className="um-worker-list" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'20px'}}>
                                    {filteredUsers.map(user => (
                                        <div key={user.id} className="um-worker-card" style={{flexDirection:'column', alignItems:'flex-start', position: 'relative'}}>
                                            <div style={{display:'flex', width:'100%', gap:'16px'}}>
                                                <div className="um-worker-avatar">
                                                    {user.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() || 'U'}
                                                </div>
                                                <div className="um-worker-info">
                                                    <div className="um-worker-name-row">
                                                        <h4 title={user.fullName}>{user.fullName}</h4>
                                                    </div>
                                                    <div className="um-worker-meta" style={{marginBottom:'4px'}}>{user.email}</div>
                                                    <div className="um-status-badge status-duty" style={{display:'inline-block'}}>{user.role || 'Resident'}</div>
                                                </div>
                                            </div>
                                            <div style={{ width: '100%', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '4px', fontSize: '0.85rem', color: '#666' }}>
                                                <div><strong>ID:</strong> {user.id}</div>
                                                <div><strong>Contact:</strong> {user.contactNumber || '—'}</div>
                                                <div style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}><strong>Address:</strong> {user.address || '—'}</div>
                                            </div>
                                            <div style={{position:'absolute', top:'16px', right:'16px', display:'flex', gap:'8px'}}>
                                                <button onClick={() => setEditingUser(user)} style={{background:'transparent', border:'none', cursor:'pointer', color:'#0284c7'}}><EditIcon /></button>
                                                <button onClick={() => setUserToDelete(user.id)} style={{background:'transparent', border:'none', cursor:'pointer', color:'#dc2626'}}><TrashIcon /></button>
                                            </div>
                                        </div>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <div style={{gridColumn:'1 / -1', textAlign:'center', color:'#9ca3af', padding:'40px'}}>
                                            No residents found
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showAddUser && (
                <AddUserModal
                    onClose={() => setShowAddUser(false)}
                    onAdd={fetchUsers}
                />
            )}
            
            {editingUser && (
                <EditUserModal 
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onRefresh={fetchUsers}
                />
            )}

            <ConfirmModal
                isOpen={!!userToDelete}
                title="Delete Resident"
                message="Are you sure you want to delete this resident account? This action cannot be undone."
                onConfirm={deleteUserConfirm}
                onCancel={() => setUserToDelete(null)}
            />
        </div>
    );
};

export default UserManagement;
