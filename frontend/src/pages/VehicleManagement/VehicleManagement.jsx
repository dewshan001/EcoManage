import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import './VehicleManagement.css';

/* ─── Maintenance Seed Data (placeholder until maintenance API is implemented) ─── */
const SEED_MAINTENANCE = [
    { id: 1, plate: 'WP-CAA-1234', service: 'Oil Change', date: '2026-04-15', priority: 'Normal', status: 'Scheduled' },
    { id: 2, plate: 'WP-CAB-5678', service: 'Brake Inspection', date: '2026-05-01', priority: 'Normal', status: 'Scheduled' },
    { id: 3, plate: 'CP-KAA-9012', service: 'Engine Overhaul', date: '2026-02-28', priority: 'High', status: 'In Progress' },
    { id: 4, plate: 'SP-GAA-3456', service: 'Tyre Replacement', date: '2026-04-28', priority: 'Normal', status: 'Scheduled' },
    { id: 5, plate: 'WP-CAC-7890', service: 'Annual Service', date: '2026-04-10', priority: 'Normal', status: 'Scheduled' },
    { id: 6, plate: 'NW-NAA-2345', service: 'Tank Sanitization', date: '2026-03-15', priority: 'Urgent', status: 'Overdue' },
];

const FUEL_ICON = { Diesel: '⛽', Electric: '⚡', CNG: '🔵' };
const STATUS_META = {
    Available: { cls: 'pill-green', dot: 'dot-green' },
    'In Use': { cls: 'pill-blue', dot: 'dot-blue' },
    Maintenance: { cls: 'pill-amber', dot: 'dot-amber' },
};

const Pill = ({ status }) => {
    const m = STATUS_META[status] ?? STATUS_META.Available;
    return <span className={`pill ${m.cls}`}><span className={`pill-dot ${m.dot}`} />{status}</span>;
};
const PriBadge = ({ p }) => {
    const c = { Normal: 'pri-normal', High: 'pri-high', Urgent: 'pri-urgent' };
    return <span className={`badge ${c[p] ?? 'pri-normal'}`}>{p}</span>;
};
const MSBadge = ({ s }) => {
    const c = { Scheduled: 'ms-scheduled', 'In Progress': 'ms-progress', Overdue: 'ms-overdue' };
    return <span className={`badge ${c[s] ?? 'ms-scheduled'}`}>{s}</span>;
};

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
);

/* ── Modals ── */
const AddVehicleModal = ({ onClose, onAdd }) => {
    const genId = () => `VEH-${Math.floor(1000 + Math.random() * 9000)}`;
    const [f, setF] = useState({ plate: '', type: 'Compactor Truck', capacity: '', fuel: 'Diesel', driver: '', vehicleId: genId() });
    const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
    const submit = e => {
        e.preventDefault();
        onAdd({ ...f, capacity: Number(f.capacity), condition: 'Good', status: 'Available', nextMaintenance: '', location: '-' });
        onClose();
    };
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <header className="modal-hdr">
                    <span className="modal-icon-wrap">🚛</span>
                    <div><h3>Register Vehicle</h3><p>Add a new vehicle to the fleet</p></div>
                    <button className="modal-x" onClick={onClose}>✕</button>
                </header>
                <form className="modal-form" onSubmit={submit}>
                    <div className="mf-row">
                        <div className="mf-field"><label>Vehicle ID</label>
                            <input name="vehicleId" value={f.vehicleId} readOnly style={{ background: 'var(--bg-lighter, #f3f4f6)', cursor: 'default', color: 'var(--primary-color, #16a34a)', fontWeight: '600' }} />
                        </div>
                        <div className="mf-field"><label>Plate Number</label>
                            <input name="plate" placeholder="e.g. WP-CAD-0001" value={f.plate} onChange={ch} required />
                        </div>
                    </div>
                    <div className="mf-row">
                        <div className="mf-field"><label>Type</label>
                            <select name="type" value={f.type} onChange={ch}>
                                <option value="Compactor Truck">Compactor Truck</option>
                                <option value="Mini Loader">Mini Loader</option>
                                <option value="Roll-Off Truck">Roll-Off Truck</option>
                                <option value="Flatbed Truck">Flatbed Truck</option>
                                <option value="Water Tanker">Water Tanker</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="mf-field"><label>Fuel</label>
                            <select name="fuel" value={f.fuel} onChange={ch}>
                                <option value="Diesel">Diesel</option>
                                <option value="Electric">Electric</option>
                                <option value="CNG">CNG</option>
                            </select>
                        </div>
                    </div>
                    <div className="mf-row">
                        <div className="mf-field"><label>Capacity (t)</label>
                            <input name="capacity" type="number" min="1" placeholder="8" value={f.capacity} onChange={ch} required />
                        </div>
                        <div className="mf-field"><label>Driver</label>
                            <input name="driver" placeholder="Full name" value={f.driver} onChange={ch} required />
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

const AssignModal = ({ task, vehicles, onClose, onAssign }) => {
    const eligible = vehicles.filter(v => v.status === 'Available' && v.type === task.vehicleType);
    const [sel, setSel] = useState(null);
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <header className="modal-hdr">
                    <span className="modal-icon-wrap">🗺️</span>
                    <div><h3>Assign Vehicle</h3><p>{task.taskId} · {task.location || 'Unknown Location'}</p></div>
                    <button className="modal-x" onClick={onClose}>✕</button>
                </header>
                <div className="task-chips">
                    <span className="task-chip">🚛 {task.vehicleType}</span>
                    <span className="task-chip">⚖️ {task.workers} workers</span>
                    <span className="task-chip">📦 Priority: {task.priority}</span>
                </div>
                {eligible.length === 0
                    ? <p className="assign-empty">No available <strong>{task.vehicleType}</strong> right now.</p>
                    : (<>
                        <p className="assign-pick">Select a vehicle to dispatch:</p>
                        <div className="assign-list">
                            {eligible.map(v => (
                                <div key={v.id || v.vehicleId} className={`assign-row ${sel === (v.id || v.vehicleId) ? 'assign-row-sel' : ''}`} onClick={() => setSel(v.id || v.vehicleId)}>
                                    <div className="assign-row-left">
                                        <span className="ar-plate">{v.plateNumber || v.plate}</span>
                                        <span className="ar-detail">{v.driver} · {v.capacity || 0}t · {v.fuel ? FUEL_ICON[v.fuel] : '⛽'} {v.fuel || 'Diesel'}</span>
                                    </div>
                                    {sel === (v.id || v.vehicleId) && <span className="ar-check">✓</span>}
                                </div>
                            ))}
                        </div>
                        <footer className="modal-footer">
                            <button className="btn-ghost" onClick={onClose}>Cancel</button>
                            <button className="btn-solid" disabled={!sel} onClick={() => { onAssign(sel, task); onClose(); }}>Dispatch →</button>
                        </footer>
                    </>)
                }
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

/* ─── Nav items ─── */
const NAV = [
    { key: 'fleet', icon: '🚛', label: 'Fleet Profiles', desc: 'Manage vehicle registry' },
    { key: 'assign', icon: '🗺️', label: 'Task Assignment', desc: 'Dispatch to routes' },
    { key: 'maintenance', icon: '🔧', label: 'Maintenance', desc: 'Service schedule' },
];

/* ═══════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════ */
export default function VehicleManagement() {
    const [view, setView] = useState('fleet');
    const [vehicles, setVehicles] = useState([]);
    const [tasksList, setTasksList] = useState([]); // Real tasks
    const [filterStatus, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [assignTask, setAssign] = useState(null);

    // Fetch vehicles
    const fetchVehicles = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/vehicles');
            setVehicles(res.data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    // Fetch tasks
    const fetchTasks = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/tasks');
            setTasksList(res.data);
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    useEffect(() => {
        fetchVehicles();
        fetchTasks();
    }, []);

    const total = vehicles.length;
    const avail = vehicles.filter(v => v.status === 'Available').length;
    const inUse = vehicles.filter(v => v.status === 'In Use').length;
    const inMaint = vehicles.filter(v => v.status === 'Maintenance').length;

    const filtered = vehicles.filter(v => {
        const okS = filterStatus === 'All' || v.status === filterStatus;
        const q = search.toLowerCase();
        // Updated search filtering to match database keys
        return okS && (!q || 
            (v.plateNumber && v.plateNumber.toLowerCase().includes(q)) || 
            (v.type && v.type.toLowerCase().includes(q)) || 
            (v.driver && v.driver.toLowerCase().includes(q)) ||
            (v.vehicleId && v.vehicleId.toLowerCase().includes(q)));
    });

    const handleAdd = async (newVehicleData) => {
        try {
            await axios.post('http://localhost:5000/api/vehicles', {
                vehicleId: newVehicleData.vehicleId,
                type: newVehicleData.type,
                driver: newVehicleData.driver,
                status: newVehicleData.status,
                condition: newVehicleData.condition,
                location: newVehicleData.location,
                fuelLevel: 100, // Default to 100% full
                lastMaintenance: new Date().toISOString().split('T')[0], // Today
                nextMaintenance: newVehicleData.nextMaintenance || '',
                plateNumber: newVehicleData.plate || newVehicleData.plateNumber
            });
            fetchVehicles();
        } catch (error) {
            console.error('Error adding vehicle:', error);
            alert('Failed to add vehicle');
        }
    };

    const handleStatus = async (id, s) => {
        try {
            await axios.put(`http://localhost:5000/api/vehicles/${id}`, { status: s });
            fetchVehicles();
        } catch (error) {
            console.error('Error updating vehicle status:', error);
        }
    };

    const handleAssign = useCallback(async (vid, task) => {
        try {
            await axios.put(`http://localhost:5000/api/vehicles/${vid}`, { status: 'In Use', location: task.location });
            await axios.put(`http://localhost:5000/api/tasks/${task.id || task.taskId}`, { status: 'Pending Worker', assignedVehicle: vid });
            fetchVehicles();
            fetchTasks();
        } catch (error) {
            console.error('Error assigning vehicle:', error);
        }
    }, []);


    const [vehicleToDelete, setVehicleToDelete] = useState(null);
    const handleDelete = useCallback((id) => {
        setVehicleToDelete(id);
    }, []);

    const confirmDelete = async () => {
        if (!vehicleToDelete) return;
        try {
            await axios.delete(`http://localhost:5000/api/vehicles/${vehicleToDelete}`);
            fetchVehicles();
        } catch (error) {
            console.error('Error deleting vehicle:', error);
            alert('Failed to delete vehicle');
        } finally {
            setVehicleToDelete(null);
        }
    };

    const activeNav = NAV.find(n => n.key === view);

    return (
        <div className="vm-root">

            {/* ══════════ SIDEBAR ══════════ */}
            <aside className="vm-sidebar">



                {/* Nav label */}
                <div className="sb-nav-label">Navigation</div>

                {/* Nav items */}
                <nav className="sb-nav">
                    {NAV.map(n => (
                        <button
                            key={n.key}
                            className={`sb-nav-item ${view === n.key ? 'sb-active' : ''}`}
                            onClick={() => setView(n.key)}
                        >
                            <span className="sb-nav-icon">{n.icon}</span>
                            <div className="sb-nav-text">
                                <span className="sb-nav-lbl">{n.label}</span>
                                <span className="sb-nav-desc">{n.desc}</span>
                            </div>
                            {view === n.key && <span className="sb-active-dot" />}
                        </button>
                    ))}
                </nav>

                <div className="sb-divider" />

                {/* Fleet stats in sidebar */}
                <div className="sb-nav-label">Fleet Status</div>
                <div className="sb-stats">
                    {[
                        { val: total, label: 'Total', color: '#a3d2ab' },
                        { val: avail, label: 'Available', color: '#34d399' },
                        { val: inUse, label: 'In Use', color: '#60a5fa' },
                        { val: inMaint, label: 'Maintenance', color: '#fbbf24' },
                    ].map(s => (
                        <div key={s.label} className="sb-stat-row">
                            <span className="sb-stat-dot" style={{ background: s.color, boxShadow: `0 0 0 3px ${s.color}30` }} />
                            <span className="sb-stat-label">{s.label}</span>
                            <span className="sb-stat-val">{s.val}</span>
                        </div>
                    ))}
                </div>

                {/* Spacer + Register button at bottom */}
                <div className="sb-spacer" />
                <button className="sb-register-btn" onClick={() => setShowAdd(true)}>
                    <span>＋</span> Register Vehicle
                </button>
            </aside>

            {/* ══════════ MAIN AREA ══════════ */}
            <div className="vm-main">

                {/* Top sub-header */}
                <div className="vm-topbar">
                    <div className="vm-topbar-left">
                        <span className="vm-topbar-icon">{activeNav.icon}</span>
                        <div>
                            <h1 className="vm-topbar-title">{activeNav.label}</h1>
                            <p className="vm-topbar-sub">{activeNav.desc}</p>
                        </div>
                    </div>
                    <div className="vm-topbar-right">
                        {/* Mini KPI chips */}
                        <div className="vm-kpi-row">
                            <span className="vm-kpi vm-kpi-green">✅ {avail} Available</span>
                            <span className="vm-kpi vm-kpi-blue">🔄 {inUse} Active</span>
                            <span className="vm-kpi vm-kpi-amber">🔧 {inMaint} Maint.</span>
                        </div>
                    </div>
                </div>

                {/* Content area */}
                <div className="vm-content">

                    {/* ─── FLEET PROFILES ─── */}
                    {view === 'fleet' && (
                        <div className="panel animate-fade-in-up">
                            {/* Toolbar */}
                            <div className="panel-toolbar">
                                <div className="search-wrap">
                                    <span className="search-ico">🔍</span>
                                    <input className="search-inp" placeholder="Search plate, type, driver…" value={search} onChange={e => setSearch(e.target.value)} />
                                    {search && <button className="search-clear" onClick={() => setSearch('')}>✕</button>}
                                </div>
                                <div className="filter-row">
                                    {['All', 'Available', 'In Use', 'Maintenance'].map(s => (
                                        <button key={s} className={`filter-btn ${filterStatus === s ? 'filter-active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
                                    ))}
                                </div>
                                <span className="count-badge">{filtered.length}/{total}</span>
                            </div>

                            {/* Table */}
                            <div className="panel-table-wrap">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Vehicle ID</th>
                                            <th>Plate No</th>
                                            <th>Type</th>
                                            <th>Driver</th>
                                            <th>Condition</th>
                                            <th>Location</th>
                                            <th>Fuel Level</th>
                                            <th>Status</th>
                                            <th>Next Service</th>
                                            <th>Update</th>
                                            <th style={{ width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(v => (
                                            <tr key={v.vehicleId || v.id} className="data-row">
                                                <td>
                                                    <div className="plate-cell">
                                                        <div className="plate-icon">🚛</div>
                                                        <div>
                                                            <span className="plate-txt">{v.vehicleId}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="td-mid">{v.plateNumber || v.plate}</td>
                                                <td className="td-mid">{v.type}</td>
                                                <td className="td-mid">{v.driver}</td>
                                                <td className="td-mid">{v.condition || 'Good'}</td>
                                                <td className="td-mid">{v.location || '-'}</td>
                                                <td className="td-mid">{v.fuelLevel ? `${v.fuelLevel}%` : '100%'}</td>
                                                <td><Pill status={v.status} /></td>
                                                <td className="td-mid td-date">{v.nextMaintenance || v.nextService || '—'}</td>
                                                <td>
                                                    <select className="status-sel" value={v.status} onChange={e => handleStatus(v.vehicleId || v.id, e.target.value)}>
                                                        <option>Available</option>
                                                        <option>In Use</option>
                                                        <option>Maintenance</option>
                                                    </select>
                                                </td>
                                                <td>
                                                    <button className="vm-btn-delete" onClick={() => handleDelete(v.vehicleId || v.id)} title="Remove Vehicle">
                                                        <TrashIcon />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr><td colSpan="11" className="td-empty">No vehicles match your filter.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* ─── TASK ASSIGNMENT ─── */}
                    {view === 'assign' && (
                        <div className="panel animate-fade-in-up">
                            <div className="assign-grid">

                                {/* Pending Tasks */}
                                <div className="assign-col">
                                    <div className="assign-col-hdr hdr-amber">
                                        <span className="assign-col-dot dot-amber" />
                                        <span>Pending Tasks</span>
                                        <span className="assign-col-count">{tasksList.filter(t => !t.assignedVehicle && (t.status === 'Pending Vehicle' || t.status === 'Assigned' || t.status === 'Pending')).length}</span>
                                    </div>
                                    <div className="assign-col-body">
                                        {tasksList.filter(t => !t.assignedVehicle && (t.status === 'Pending Vehicle' || t.status === 'Assigned' || t.status === 'Pending')).map(t => {
                                            const can = vehicles.some(v => v.status === 'Available' && v.type === t.vehicleType);
                                            return (
                                                <div key={t.id || t.taskId} className="task-card">
                                                    <div className="tc-top">
                                                        <span className="tc-id">{t.taskId}</span>
                                                        <span className="tc-type">{t.priority}</span>
                                                    </div>
                                                    <div className="tc-zone">📍 {t.location || 'Unknown Location'}</div>
                                                    <div className="tc-meta">🚛 {t.vehicleType} · ⚖️ {t.workers} workers</div>
                                                    <button
                                                        className={`tc-btn ${can ? 'tc-btn-enabled' : 'tc-btn-disabled'}`}
                                                        onClick={() => can && setAssign(t)}
                                                        disabled={!can}>
                                                        {can ? 'Assign Vehicle →' : 'No eligible vehicle'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Active Routes */}
                                <div className="assign-col">
                                    <div className="assign-col-hdr hdr-blue">
                                        <span className="assign-col-dot dot-blue" />
                                        <span>Active Routes</span>
                                        <span className="assign-col-count">{inUse}</span>
                                    </div>
                                    <div className="assign-col-body">
                                        {vehicles.filter(v => v.status === 'In Use').map(v => (
                                            <div key={v.id || v.vehicleId} className="active-card">
                                                <div className="ac-top">
                                                    <span className="ac-pulse" />
                                                    <span className="ac-plate">{v.plateNumber || v.plate}</span>
                                                    <Pill status="In Use" />
                                                </div>
                                                <div className="ac-driver">👤 {v.driver}</div>
                                                {v.location && <div className="ac-zone">📍 {v.location}</div>}
                                                <div className="ac-type">{v.type} · {v.capacity || 0}t</div>
                                            </div>
                                        ))}
                                        {inUse === 0 && <div className="col-empty">No active routes.</div>}
                                    </div>
                                </div>

                                {/* Available Pool */}
                                <div className="assign-col">
                                    <div className="assign-col-hdr hdr-green">
                                        <span className="assign-col-dot dot-green" />
                                        <span>Available Pool</span>
                                        <span className="assign-col-count">{avail}</span>
                                    </div>
                                    <div className="assign-col-body">
                                        {vehicles.filter(v => v.status === 'Available').map(v => (
                                            <div key={v.id} className="avail-card">
                                                <div className="av-top">
                                                    <span className="av-plate">{v.plate}</span>
                                                    <span className="av-ready">Ready</span>
                                                </div>
                                                <div className="av-type">{v.type}</div>
                                                <div className="av-tags">
                                                    <span className="av-tag">{FUEL_ICON[v.fuel]} {v.fuel}</span>
                                                    <span className="av-tag">⚖️ {v.capacity}t</span>
                                                </div>
                                            </div>
                                        ))}
                                        {avail === 0 && <div className="col-empty">All vehicles deployed.</div>}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* ─── MAINTENANCE ─── */}
                    {view === 'maintenance' && (
                        <div className="panel animate-fade-in-up">
                            {/* Mini KPIs */}
                            <div className="mnt-kpi-row">
                                {[
                                    { icon: '📅', label: 'Scheduled', count: SEED_MAINTENANCE.filter(m => m.status === 'Scheduled').length, cls: 'mk-blue' },
                                    { icon: '🔧', label: 'In Progress', count: SEED_MAINTENANCE.filter(m => m.status === 'In Progress').length, cls: 'mk-amber' },
                                    { icon: '⚠️', label: 'Overdue', count: SEED_MAINTENANCE.filter(m => m.status === 'Overdue').length, cls: 'mk-red' },
                                ].map(k => (
                                    <div key={k.label} className={`mnt-kpi ${k.cls}`}>
                                        <span className="mk-icon">{k.icon}</span>
                                        <span className="mk-val">{k.count}</span>
                                        <span className="mk-lbl">{k.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Two-column: table + timeline */}
                            <div className="mnt-layout">
                                <div className="panel-table-wrap">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Vehicle</th>
                                                <th>Service</th>
                                                <th>Date</th>
                                                <th>Priority</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {SEED_MAINTENANCE.map(m => (
                                                <tr key={m.id} className={`data-row ${m.status === 'Overdue' ? 'row-overdue' : ''}`}>
                                                    <td>
                                                        <div className="plate-cell">
                                                            <div className="plate-icon">🚛</div>
                                                            <span className="plate-txt">{m.plate}</span>
                                                        </div>
                                                    </td>
                                                    <td className="td-mid">{m.service}</td>
                                                    <td className="td-mid td-date">{m.date}</td>
                                                    <td><PriBadge p={m.priority} /></td>
                                                    <td><MSBadge s={m.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Timeline */}
                                <div className="timeline-wrap">
                                    <div className="tl-title">Service Timeline</div>
                                    <div className="timeline">
                                        {SEED_MAINTENANCE.map(m => (
                                            <div key={m.id} className="tl-item">
                                                <div className={`tl-dot ${m.status === 'Overdue' ? 'tl-red' : m.status === 'In Progress' ? 'tl-amber' : 'tl-green'}`} />
                                                <div className="tl-card">
                                                    <div className="tl-top">
                                                        <span className="tl-plate">{m.plate}</span>
                                                        <PriBadge p={m.priority} />
                                                    </div>
                                                    <div className="tl-service">{m.service}</div>
                                                    <div className="tl-date">📅 {m.date}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                </div>{/* vm-content */}
            </div>{/* vm-main */}

            {/* Modals */}
            {showAdd && <AddVehicleModal onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
            {assignTask && <AssignModal task={assignTask} vehicles={vehicles} onClose={() => setAssign(null)} onAssign={handleAssign} />}
            <ConfirmModal
                isOpen={!!vehicleToDelete}
                title="Remove Vehicle"
                message="Are you sure you want to remove this vehicle from the fleet? This action cannot be undone."
                onConfirm={confirmDelete}
                onCancel={() => setVehicleToDelete(null)}
            />
        </div>
    );
}
