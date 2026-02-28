import React, { useState } from 'react';
import './Workers.css';

// --- Icons ---
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
);

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
);

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);

const MapPinIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
);

const ClockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);

const TruckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

// --- Mock Data ---
// (Mock data removed as we fetch from backend)

/* ─── Nav items ─── */
const NAV = [
    { key: 'dashboard', icon: '📊', label: 'Operations Dashboard', desc: 'Overview of all active operations and staff rosters' },
    { key: 'roster', icon: '📝', label: 'Staff Roster', desc: 'Detailed view of all registered workers' },
    { key: 'assignments', icon: '🗺️', label: 'Duty Mapping', desc: 'Visual overview of assignments' },
];

const Workers = () => {
    // Top-Level State
    const [view, setView] = useState('dashboard');
    const [workers, setWorkers] = useState([]);
    const [tasks, setTasks] = useState([]);

    // Fetch workers from backend when component mounts
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/auth/workers');
                // Fetch tasks from backend
                let formattedTasks = [];
                const tasksResponse = await fetch('http://localhost:5000/api/tasks');
                if (tasksResponse.ok) {
                    const tasksData = await tasksResponse.json();
                    
                    formattedTasks = tasksData.map(t => {
                        // Keep 'Pending Worker' mapped to "Pending" for worker board view if it doesn't have worker assigned
                        let status = t.status;
                        if (status === 'Pending Worker' || status === 'Pending') {
                            status = t.assignedTo ? 'Active' : 'Pending';
                        }
                        
                        return {
                            id: t.taskId,
                            dbId: t.id,
                            location: t.location || 'Unknown Location',
                            type: t.description || 'General Task',
                            priority: t.priority,
                            status: status,
                            assignedTo: t.assignedTo || null,
                            assignedVehicle: t.assignedVehicle || null, // Capture assigned vehicle
                            date: t.scheduleDate ? t.scheduleDate.split('T')[0] : 'TBD',
                            time: t.scheduleDate ? t.scheduleDate.split('T')[1]?.substring(0,5) : 'TBD'
                        };
                    });
                    
                    setTasks(formattedTasks);
                }

                // Match workers with their assigned task from tasks backend because worker backend doesn't store active tasks yet reliably
                if (response.ok) {
                    const data = await response.json();

                    // Map the DB worker data to the format expected by the frontend
                    const formattedWorkers = data.workers.map(w => {
                        const formattedId = `W${w.id.toString().padStart(3, '0')}`;
                        
                        // Find if there's any active task assigned to this worker
                        const activeTask = formattedTasks.find(t => t.assignedTo === formattedId && t.status === 'Active');

                        return {
                            dbId: w.id, // Keep the numeric DB ID
                            id: formattedId, // Format the display ID
                            name: w.name,
                            role: w.role,
                            skill: w.skill,
                            status: w.status,
                            avatar: w.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'W',
                            taskId: activeTask ? activeTask.id : null
                        };
                    });

                    setWorkers(formattedWorkers);
                } else {
                    console.error('Failed to fetch workers:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
    }, []);

    // UI Modals
    const [showAddWorker, setShowAddWorker] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // UI State for Assignment Modal/Dropdown
    const [assigningTask, setAssigningTask] = useState(null);

    // --- Modals ---
    const AddWorkerModal = ({ onClose, onAdd }) => {
        const [f, setF] = useState({ name: '', email: '', password: '', role: 'Collector', skill: 'General Waste' });
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
        const submit = async e => {
            e.preventDefault();
            setLoading(true);
            setError('');

            try {
                const response = await fetch('http://localhost:5000/api/auth/register-worker', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fullName: f.name,
                        email: f.email,
                        password: f.password,
                        workerRole: f.role,
                        skill: f.skill
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to register worker');
                }

                // Add to local state (using standard initials for avatar)
                const initials = f.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'W';
                onAdd({
                    dbId: data.user.dbId,
                    id: data.user.id,
                    name: f.name,
                    email: f.email,
                    status: data.user.status,
                    avatar: initials,
                    role: data.user.role, // ensure mapping is correct 
                    skill: data.user.skill,
                    contact: 'N/A',
                    shift: 'N/A',
                    region: 'N/A'
                });
                onClose();
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <header className="modal-hdr">
                        <span className="modal-icon-wrap">👷‍♂️</span>
                        <div><h3>Register Worker</h3><p>Add a new staff member to the roster</p></div>
                        <button className="modal-x" onClick={onClose} disabled={loading}>✕</button>
                    </header>
                    <form className="modal-form" onSubmit={submit}>
                        {error && <div style={{ color: 'red', margin: '10px 0', padding: '10px', backgroundColor: '#fee2e2', borderRadius: '4px' }}>{error}</div>}
                        <div className="mf-field"><label>Full Name</label>
                            <input name="name" placeholder="e.g. Saman Kumara" value={f.name} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Email Address</label>
                            <input type="email" name="email" placeholder="worker@ecomanage.com" value={f.email} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Password</label>
                            <input type="password" name="password" placeholder="Create a strong password" value={f.password} onChange={ch} required minLength="6" />
                        </div>
                        <div className="mf-row">
                            <div className="mf-field"><label>Role</label>
                                <select name="role" value={f.role} onChange={ch}>
                                    {['Collector', 'Driver', 'Supervisor', 'Maintenance'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="mf-field"><label>Specialty / Skill</label>
                                <select name="skill" value={f.skill} onChange={ch}>
                                    {['General Waste', 'Recycling', 'Hazardous', 'Heavy Vehicle', 'Light Vehicle', 'Field Ops'].map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                        <footer className="modal-footer">
                            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                            <button type="submit" className="btn-solid" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
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

    // --- Derived State ---
    const activeNav = NAV.find(n => n.key === view);

    const filteredWorkers = workers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || w.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterStatus === 'All' ? true : w.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const pendingTasks = tasks.filter(t => t.status === 'Pending');
    const activeTasks = tasks.filter(t => t.status === 'Active');
    const availableWorkers = workers.filter(w => w.status === 'Available');

    // Sidebar Staff Stats Calculations
    const totalWorkers = workers.length;
    const availCount = workers.filter(w => w.status === 'Available').length;
    const onDutyCount = workers.filter(w => w.status === 'On Duty').length;
    const onLeaveCount = workers.filter(w => w.status === 'Leave').length;

    // --- Handlers ---
    const handleAssignWorker = async (taskId, workerId) => {
        // Find task and worker details
        const task = tasks.find(t => t.id === taskId);
        const worker = workers.find(w => w.id === workerId);
        
        if (!task || !worker) return;

        try {
            // Update backend Task
            await fetch(`http://localhost:5000/api/tasks/${task.dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Active', assignedTo: workerId })
            });

            // Update backend Worker
            await fetch(`http://localhost:5000/api/auth/workers/${worker.dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'On Duty' })
            });

            // Update Task State
            setTasks(prevTasks => prevTasks.map(t =>
                t.id === taskId
                    ? { ...t, status: 'Active', assignedTo: workerId }
                    : t
            ));

            // Update Worker State
            setWorkers(prevWorkers => prevWorkers.map(w =>
                w.id === workerId
                    ? { ...w, status: 'On Duty', taskId: taskId }
                    : w
            ));
        } catch (error) {
            console.error('Error assigning worker:', error);
        }

        setAssigningTask(null); // Close dropdown
    };

    const handleCompleteTask = async (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.assignedTo) return;
        
        const worker = workers.find(w => w.id === task.assignedTo);

        try {
            // Update backend Task
            await fetch(`http://localhost:5000/api/tasks/${task.dbId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' })
            });

            if (worker) {
                // Update backend Worker
                await fetch(`http://localhost:5000/api/auth/workers/${worker.dbId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Available' })
                });
            }

            if (task.assignedVehicle) {
                // Update backend Vehicle
                await fetch(`http://localhost:5000/api/vehicles/${task.assignedVehicle}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'Available', location: '-' })
                });
            }

            // Remove task from active list by changing its status to Completed
            setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

            // Free up worker
            setWorkers(prevWorkers => prevWorkers.map(w =>
                w.id === task.assignedTo
                    ? { ...w, status: 'Available', taskId: null }
                    : w
            ));
        } catch (error) {
            console.error('Error completing task:', error);
        }
    };

    const [workerToDelete, setWorkerToDelete] = useState(null);

    const handleDeleteWorker = (workerId) => {
        setWorkerToDelete(workerId);
    };

    const confirmDeleteWorker = async () => {
        if (workerToDelete) {
            try {
                // Find worker by formatted ID to get the dbId
                const worker = workers.find(w => w.id === workerToDelete);
                if (worker) {
                    const response = await fetch(`http://localhost:5000/api/auth/workers/${worker.dbId}`, {
                        method: 'DELETE'
                    });

                    if (response.ok) {
                        setWorkers(prevWorkers => prevWorkers.filter(w => w.id !== workerToDelete));
                    } else {
                        console.error('Failed to delete worker');
                    }
                }
            } catch (error) {
                console.error('Error deleting worker:', error);
            } finally {
                setWorkerToDelete(null);
            }
        }
    };

    // --- Helpers ---
    const getStatusConfig = (status) => {
        switch (status) {
            case 'Available': return 'status-available';
            case 'On Duty': return 'status-duty';
            case 'Leave': return 'status-leave';
            default: return '';
        }
    };

    const getPriorityConfig = (priority) => {
        switch (priority) {
            case 'High': return 'priority-high';
            case 'Medium': return 'priority-medium';
            case 'Low': return 'priority-low';
            default: return '';
        }
    };

    return (
        <div className="wm-root">

            {/* ══════════ SIDEBAR (Matches Vehicle Management) ══════════ */}
            <aside className="wm-sidebar">

                {/* Nav label */}
                <div className="wm-sb-nav-label">Navigation</div>

                {/* Nav items */}
                <nav className="wm-sb-nav">
                    {NAV.map(n => (
                        <button
                            key={n.key}
                            className={`wm-sb-nav-item ${view === n.key ? 'wm-sb-active' : ''}`}
                            onClick={() => setView(n.key)}
                        >
                            <span className="wm-sb-nav-icon">{n.icon}</span>
                            <div className="wm-sb-nav-text">
                                <span className="wm-sb-nav-lbl">{n.label}</span>
                                <span className="wm-sb-nav-desc">{n.desc}</span>
                            </div>
                            {view === n.key && <span className="wm-sb-active-dot" />}
                        </button>
                    ))}
                </nav>

                <div className="wm-sb-divider" />

                {/* Stats in sidebar */}
                <div className="wm-sb-nav-label">Staff Status</div>
                <div className="wm-sb-stats">
                    {[
                        { val: totalWorkers, label: 'Total Staff', color: '#a3d2ab' },
                        { val: availCount, label: 'Available', color: '#34d399' },
                        { val: onDutyCount, label: 'On Duty', color: '#60a5fa' },
                        { val: onLeaveCount, label: 'On Leave', color: '#fbbf24' },
                    ].map(s => (
                        <div key={s.label} className="wm-sb-stat-row">
                            <span className="wm-sb-stat-dot" style={{ background: s.color, boxShadow: `0 0 0 3px ${s.color}30` }} />
                            <span className="wm-sb-stat-label">{s.label}</span>
                            <span className="wm-sb-stat-val">{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Spacer + Add button at bottom */}
                <div className="wm-sb-spacer" />
                <button className="wm-sb-register-btn" onClick={() => setShowAddWorker(true)}>
                    <span>＋</span> Register Worker
                </button>
            </aside>


            {/* ══════════ MAIN AREA ══════════ */}
            <main className="wm-main">

                {/* Topbar */}
                <header className="wm-topbar">
                    <div className="wm-topbar-left">
                        <span className="wm-topbar-icon">{activeNav.icon}</span>
                        <div>
                            <h1 className="wm-topbar-title">{activeNav.label}</h1>
                            <p className="wm-topbar-sub">{activeNav.desc}</p>
                        </div>
                    </div>
                    <div className="wm-topbar-right">
                        <div className="wm-kpi-row">
                            <span className="wm-kpi vm-kpi-green">✅ {availCount} Ready</span>
                            <span className="wm-kpi vm-kpi-blue">🔄 {onDutyCount} Field</span>
                            <span className="wm-kpi vm-kpi-amber">🏝️ {onLeaveCount} Leave</span>
                        </div>
                    </div>
                </header>

                {/* Content Container */}
                <div className="wm-content">

                    {/* ONLY SHOW THIS VIEW IF 'dashboard' is selected */}
                    {view === 'dashboard' && (
                        <div className="wm-grid-layout">

                            {/* 1. Worker Profiles (Left Panel) */}
                            <div className="wm-panel wm-profiles-panel animate-fade-in">
                                <div className="wm-panel-header">
                                    <h2>Worker Roster</h2>

                                    <div className="wm-controls">
                                        <div className="wm-search-bar">
                                            <SearchIcon />
                                            <input
                                                type="text"
                                                placeholder="Search name or ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="wm-filter-dropdown">
                                            <FilterIcon />
                                            <select
                                                value={filterStatus}
                                                onChange={(e) => setFilterStatus(e.target.value)}
                                            >
                                                <option value="All">All Status</option>
                                                <option value="Available">Available</option>
                                                <option value="On Duty">On Duty</option>
                                                <option value="Leave">On Leave</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="wm-panel-content custom-scrollbar">
                                    <div className="wm-worker-list">
                                        {filteredWorkers.map(w => (
                                            <div key={w.id} className="wm-worker-card">
                                                <div className="wm-worker-avatar">{w.avatar}</div>
                                                <div className="wm-worker-info">
                                                    <div className="wm-worker-name-row">
                                                        <h4>{w.name}</h4>
                                                        <span className={`wm-status-badge ${getStatusConfig(w.status)}`}>
                                                            {w.status}
                                                        </span>
                                                    </div>
                                                    <div className="wm-worker-meta">
                                                        <span>{w.id}</span>
                                                        <span className="dot">•</span>
                                                        <span>{w.role}</span>
                                                        <span className="dot">•</span>
                                                        <span>{w.skill}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {filteredWorkers.length === 0 && (
                                            <div className="wm-empty-state">
                                                <p>No workers matched your search.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 2. Task Assignment Board (Center Panel) */}
                            <div className="wm-panel wm-assignment-panel animate-fade-in">
                                <div className="wm-panel-header">
                                    <h2>Pending Assignments</h2>
                                    <span className="wm-badge-count">{pendingTasks.length} Issues</span>
                                </div>

                                <div className="wm-panel-content custom-scrollbar">
                                    <div className="wm-task-list">
                                        {pendingTasks.map(task => (
                                            <div key={task.id} className="wm-task-card unassigned">
                                                <div className="wm-task-header">
                                                    <span className={`wm-priority-indicator ${getPriorityConfig(task.priority)}`}></span>
                                                    <span className="wm-task-id">{task.id}</span>
                                                    <span className="wm-task-type">{task.type}</span>
                                                </div>
                                                <div className="wm-task-body">
                                                    <div className="wm-task-location">
                                                        <MapPinIcon /> {task.location}
                                                    </div>
                                                </div>
                                                <div className="wm-task-footer">

                                                    {/* Assignment Dropdown Toggle */}
                                                    {assigningTask === task.id ? (
                                                        <div className="wm-assign-dropdown-container">
                                                            <select
                                                                className="wm-assign-select"
                                                                onChange={(e) => handleAssignWorker(task.id, e.target.value)}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Select available worker...</option>
                                                                {availableWorkers.length > 0 ? (
                                                                    availableWorkers.map(aw => (
                                                                        <option key={aw.id} value={aw.id}>
                                                                            {aw.name} ({aw.role})
                                                                        </option>
                                                                    ))
                                                                ) : (
                                                                    <option value="" disabled>No workers available</option>
                                                                )}
                                                            </select>
                                                            <button
                                                                className="wm-btn-cancel"
                                                                onClick={() => setAssigningTask(null)}
                                                            >
                                                                X
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            className="wm-btn-assign"
                                                            onClick={() => setAssigningTask(task.id)}
                                                        >
                                                            <UserIcon /> Assign Worker
                                                        </button>
                                                    )}

                                                </div>
                                            </div>
                                        ))}

                                        {pendingTasks.length === 0 && (
                                            <div className="wm-empty-state success">
                                                <CheckCircleIcon />
                                                <p>All pending tasks have been assigned!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 3. Active Operations (Right Panel) */}
                            <div className="wm-panel wm-active-panel animate-fade-in">
                                <div className="wm-panel-header">
                                    <h2>Active Operations</h2>
                                    <span className="wm-badge-count green">{activeTasks.length} Live</span>
                                </div>

                                {/* Faux Map Area */}
                                <div className="wm-map-placeholder">
                                    <div className="wm-map-overlay">
                                        <span className="wm-map-pulse" style={{ top: '30%', left: '40%' }}></span>
                                        <span className="wm-map-pulse" style={{ top: '70%', left: '60%' }}></span>
                                        <div className="wm-map-label">Live City Grid Tracking</div>
                                    </div>
                                </div>

                                <div className="wm-panel-content custom-scrollbar" style={{ flex: 1, padding: '20px' }}>
                                    <div className="wm-active-list">
                                        {activeTasks.map(task => {
                                            const worker = workers.find(w => w.id === task.assignedTo);
                                            return (
                                                <div key={task.id} className="wm-active-card">
                                                    <div className="wm-active-header">
                                                        <div className="wm-active-worker-info">
                                                            <span className="wm-mini-avatar">{worker?.avatar}</span>
                                                            <strong>{worker?.name}</strong>
                                                            <span className="wm-task-type mini">{task.type}</span>
                                                        </div>
                                                    </div>
                                                    <div className="wm-active-location">
                                                        <MapPinIcon /> {task.location}
                                                    </div>
                                                    <div className="wm-active-actions">
                                                        <div className="wm-active-time">
                                                            <ClockIcon /> In Progress
                                                        </div>
                                                        <button
                                                            className="wm-btn-complete"
                                                            onClick={() => handleCompleteTask(task.id)}
                                                            title="Mark task as resolved and free the worker"
                                                        >
                                                            <CheckCircleIcon /> Resolve
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {activeTasks.length === 0 && (
                                            <div className="wm-empty-state">
                                                <TruckIcon />
                                                <p>No active field operations right now.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                    {/* ══ Staff Roster View ══ */}
                    {view === 'roster' && (
                        <div className="wm-panel animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <div className="wm-panel-header" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <h2>Complete Staff Roster</h2>
                                <div className="wm-controls" style={{ flexDirection: 'row' }}>
                                    <div className="wm-search-bar">
                                        <SearchIcon />
                                        <input
                                            type="text"
                                            placeholder="Search roster..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <div className="wm-filter-dropdown">
                                        <FilterIcon />
                                        <select
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                        >
                                            <option value="All">All Status</option>
                                            <option value="Available">Available</option>
                                            <option value="On Duty">On Duty</option>
                                            <option value="Leave">On Leave</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="wm-panel-content custom-scrollbar" style={{ padding: 0 }}>
                                <table className="wm-roster-table">
                                    <thead>
                                        <tr>
                                            <th>Staff Member</th>
                                            <th>ID & Role</th>
                                            <th>Skill / Specialty</th>
                                            <th>Current Task</th>
                                            <th>Task Details</th>
                                            <th>Status</th>
                                            <th style={{ width: '50px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredWorkers.map(w => (
                                            <tr key={w.id}>
                                                <td>
                                                    <div className="wm-table-worker">
                                                        <div className="wm-worker-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>{w.avatar}</div>
                                                        <strong>{w.name}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="wm-table-cell-stack">
                                                        <span>{w.id}</span>
                                                        <span className="wm-task-type mini" style={{ width: 'fit-content' }}>{w.role}</span>
                                                    </div>
                                                </td>
                                                <td>{w.skill || 'No Skill Listed'}</td>
                                                <td>
                                                    {w.taskId ? (
                                                        <span style={{ fontSize: '0.85rem', color: '#6366f1', fontWeight: 600 }}>{w.taskId}</span>
                                                    ) : (
                                                        <span style={{ color: '#9ca3af' }}>Unassigned</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {w.status === 'On Duty' && w.taskId ? (
                                                        <div className="wm-table-cell-stack">
                                                            <span>{tasks.find(t => t.id === w.taskId)?.type || 'Active Mission'}</span>
                                                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                <MapPinIcon style={{ width: '10px', height: '10px', display: 'inline', marginRight: '4px' }} />
                                                                {tasks.find(t => t.id === w.taskId)?.location || 'Field'}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#9ca3af' }}>-</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`wm-status-badge ${getStatusConfig(w.status)}`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button className="wm-btn-delete" onClick={() => handleDeleteWorker(w.id)} title="Remove Staff">
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredWorkers.length === 0 && (
                                    <div className="wm-empty-state" style={{ padding: '40px' }}>
                                        <p>No workers matched your search.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ══ Duty Mapping View ══ */}
                    {view === 'assignments' && (
                        <div className="wm-grid-layout" style={{ gridTemplateColumns: '1fr 380px' }}>
                            {/* Map / Visual Board Area */}
                            <div className="wm-panel animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                                <div className="wm-panel-header">
                                    <h2>Interactive Duty Map</h2>
                                </div>
                                <div className="wm-panel-content" style={{ padding: 0, position: 'relative', display: 'flex', flex: 1, background: '#e5e7eb' }}>
                                    <div className="wm-map-placeholder" style={{ height: '100%', width: '100%', borderBottom: 'none' }}>
                                        <div className="wm-map-overlay" style={{ position: 'absolute', inset: 0, display: 'block' }}>
                                            {/* Simulated Map Markers for Tasks */}
                                            {tasks.map((t, i) => (
                                                <div key={t.id} className="wm-map-marker" style={{ position: 'absolute', top: `${20 + (i * 15)}%`, left: `${10 + (i * 18)}%` }}>
                                                    <div className={`wm-marker-pin ${t.status === 'Active' ? 'active' : 'pending'}`}>
                                                        <MapPinIcon />
                                                    </div>
                                                    <div className="wm-marker-popup">
                                                        <strong>{t.id}</strong>
                                                        <span>{t.location}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mission Control Sidebar */}
                            <div className="wm-panel animate-fade-in wm-assignment-panel">
                                <div className="wm-panel-header">
                                    <h2>Mission Control</h2>
                                    <span className="wm-badge-count">{tasks.length} Total</span>
                                </div>
                                <div className="wm-panel-content custom-scrollbar">
                                    <div className="wm-task-list" style={{ gridTemplateColumns: '1fr' }}>
                                        {tasks.map(task => {
                                            const isAssigned = task.status === 'Active';
                                            const worker = isAssigned ? workers.find(w => w.id === task.assignedTo) : null;
                                            return (
                                                <div key={task.id} className={`wm-task-card ${!isAssigned ? 'unassigned' : ''}`}>
                                                    <div className="wm-task-header">
                                                        <span className={`wm-priority-indicator ${getPriorityConfig(task.priority)}`}></span>
                                                        <span className="wm-task-id">{task.id}</span>
                                                        <span className="wm-task-type mini">{task.type}</span>
                                                    </div>
                                                    <div className="wm-task-body" style={{ marginTop: 8 }}>
                                                        <div className="wm-task-location" style={{ fontSize: '0.9rem' }}>
                                                            <MapPinIcon /> {task.location}
                                                        </div>
                                                        <div className="wm-task-time" style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
                                                            <ClockIcon /> {task.date} at {task.time}
                                                        </div>
                                                    </div>
                                                    <div className="wm-task-footer" style={{ marginTop: 12, paddingTop: 12 }}>
                                                        {isAssigned ? (
                                                            <div className="wm-assigned-status" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div className="wm-active-worker-info">
                                                                    <span className="wm-mini-avatar">{worker?.avatar}</span>
                                                                    <strong style={{ fontSize: '0.85rem' }}>{worker?.name}</strong>
                                                                </div>
                                                                <span className="wm-status-badge status-duty" style={{ whiteSpace: 'nowrap' }}>En Route</span>
                                                            </div>
                                                        ) : (
                                                            assigningTask === task.id ? (
                                                                <div className="wm-assign-dropdown-container">
                                                                    <select
                                                                        className="wm-assign-select"
                                                                        onChange={(e) => handleAssignWorker(task.id, e.target.value)}
                                                                        defaultValue=""
                                                                    >
                                                                        <option value="" disabled>Select available worker...</option>
                                                                        {availableWorkers.length > 0 ? (
                                                                            availableWorkers.map(aw => (
                                                                                <option key={aw.id} value={aw.id}>
                                                                                    {aw.name} ({aw.role})
                                                                                </option>
                                                                            ))
                                                                        ) : (
                                                                            <option value="" disabled>No workers available</option>
                                                                        )}
                                                                    </select>
                                                                    <button className="wm-btn-cancel" onClick={() => setAssigningTask(null)}>X</button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    className="wm-btn-assign"
                                                                    onClick={() => setAssigningTask(task.id)}
                                                                >
                                                                    <UserIcon /> Assign Worker
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Modals */}
            {showAddWorker && (
                <AddWorkerModal
                    onClose={() => setShowAddWorker(false)}
                    onAdd={(newWorker) => setWorkers([...workers, newWorker])}
                />
            )}

            <ConfirmModal
                isOpen={!!workerToDelete}
                title="Remove Staff"
                message="Are you sure you want to remove this staff member from the roster? This action cannot be undone."
                onConfirm={confirmDeleteWorker}
                onCancel={() => setWorkerToDelete(null)}
            />
        </div>
    );
};

export default Workers;
