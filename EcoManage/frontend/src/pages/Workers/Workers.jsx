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

// --- Mock Data ---
const initialWorkers = [
    { id: 'W001', name: 'Kamal Perera', role: 'Driver', skill: 'Heavy Vehicle', status: 'Available', avatar: 'KP' },
    { id: 'W002', name: 'Nimal Silva', role: 'Collector', skill: 'General Waste', status: 'On Duty', avatar: 'NS', taskId: 'T-1042' },
    { id: 'W003', name: 'Sunil Fernando', role: 'Driver', skill: 'Compactor', status: 'Leave', avatar: 'SF' },
    { id: 'W004', name: 'Chaminda Silva', role: 'Collector', skill: 'Recycling', status: 'Available', avatar: 'CS' },
    { id: 'W005', name: 'Ajith Kumara', role: 'Supervisor', skill: 'Field Ops', status: 'Available', avatar: 'AK' },
    { id: 'W006', name: 'Nuwan Pradeep', role: 'Collector', skill: 'Hazardous', status: 'On Duty', avatar: 'NP', taskId: 'T-1043' },
    { id: 'W007', name: 'Ruwan Kumara', role: 'Driver', skill: 'Light Vehicle', status: 'Available', avatar: 'RK' },
];

const initialTasks = [
    { id: 'T-1042', location: 'Galle Road, Mount Lavinia', type: 'Routine Collection', priority: 'Medium', status: 'Active', assignedTo: 'W002' },
    { id: 'T-1043', location: 'Park Avenue, Colombo 03', type: 'Hazardous Waste', priority: 'High', status: 'Active', assignedTo: 'W006' },
    { id: 'T-1044', location: 'Main Market, Pettah', type: 'Bulk Clearance', priority: 'High', status: 'Pending', assignedTo: null },
    { id: 'T-1045', location: 'Beach Road, Dehiwala', type: 'Routine Collection', priority: 'Low', status: 'Pending', assignedTo: null },
    { id: 'T-1046', location: 'Lake Drive, Rajagiriya', type: 'Recycling', priority: 'Medium', status: 'Pending', assignedTo: null },
];

/* ─── Nav items ─── */
const NAV = [
    { key: 'dashboard', icon: '📊', label: 'Operations Dashboard', desc: 'Overview of all active operations and staff rosters' },
    { key: 'roster', icon: '📝', label: 'Staff Roster', desc: 'Detailed view of all registered workers' },
    { key: 'assignments', icon: '🗺️', label: 'Duty Mapping', desc: 'Visual overview of assignments' },
];

const Workers = () => {
    // Top-Level State
    const [view, setView] = useState('dashboard');
    const [workers, setWorkers] = useState(initialWorkers);
    const [tasks, setTasks] = useState(initialTasks);

    // UI Modals
    const [showAddWorker, setShowAddWorker] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // UI State for Assignment Modal/Dropdown
    const [assigningTask, setAssigningTask] = useState(null);

    // --- Modals ---
    const AddWorkerModal = ({ onClose, onAdd }) => {
        const [f, setF] = useState({ name: '', role: 'Collector', skill: 'General Waste' });
        const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
        const submit = e => {
            e.preventDefault();
            const newId = `W${Math.floor(100 + Math.random() * 900)}`;
            const initials = f.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'W';
            onAdd({ ...f, id: newId, status: 'Available', avatar: initials });
            onClose();
        };
        return (
            <div className="modal-backdrop" onClick={onClose}>
                <div className="modal-box" onClick={e => e.stopPropagation()}>
                    <header className="modal-hdr">
                        <span className="modal-icon-wrap">👷‍♂️</span>
                        <div><h3>Register Worker</h3><p>Add a new staff member to the roster</p></div>
                        <button className="modal-x" onClick={onClose}>✕</button>
                    </header>
                    <form className="modal-form" onSubmit={submit}>
                        <div className="mf-field"><label>Full Name</label>
                            <input name="name" placeholder="e.g. Saman Kumara" value={f.name} onChange={ch} required />
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
                            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-solid">Register</button>
                        </footer>
                    </form>
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
    const handleAssignWorker = (taskId, workerId) => {
        // Update Task
        setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId
                ? { ...t, status: 'Active', assignedTo: workerId }
                : t
        ));

        // Update Worker
        setWorkers(prevWorkers => prevWorkers.map(w =>
            w.id === workerId
                ? { ...w, status: 'On Duty', taskId: taskId }
                : w
        ));

        setAssigningTask(null); // Close dropdown
    };

    const handleCompleteTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.assignedTo) return;

        // Remove task from active list
        setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

        // Free up worker
        setWorkers(prevWorkers => prevWorkers.map(w =>
            w.id === task.assignedTo
                ? { ...w, status: 'Available', taskId: null }
                : w
        ));
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

                    {/* Placeholder for other views */}
                    {view !== 'dashboard' && (
                        <div className="wm-panel" style={{ height: '100%' }}>
                            <div className="wm-empty-state" style={{ margin: 'auto' }}>
                                <h3>{activeNav.label} View</h3>
                                <p>This specific view module is not yet implemented in the prototype.</p>
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
        </div>
    );
};

export default Workers;
