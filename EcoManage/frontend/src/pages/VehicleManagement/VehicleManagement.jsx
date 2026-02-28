import React, { useState, useCallback } from 'react';
import './VehicleManagement.css';

/* ─── Seed Data ─── */
const SEED_VEHICLES = [
    { id: 1, plate: 'WP-CAA-1234', type: 'Compactor Truck', capacity: 8, fuel: 'Diesel', status: 'Available', driver: 'Kamal Perera', nextService: '2026-04-15', zone: null },
    { id: 2, plate: 'WP-CAB-5678', type: 'Mini Loader', capacity: 2, fuel: 'Electric', status: 'In Use', driver: 'Sunil Gamage', nextService: '2026-05-01', zone: 'Zone 3 – Colombo West' },
    { id: 3, plate: 'CP-KAA-9012', type: 'Roll-Off Truck', capacity: 12, fuel: 'Diesel', status: 'Maintenance', driver: 'Nimal Silva', nextService: '2026-05-20', zone: null },
    { id: 4, plate: 'SP-GAA-3456', type: 'Flatbed Truck', capacity: 6, fuel: 'CNG', status: 'Available', driver: 'Ravi Fernando', nextService: '2026-04-28', zone: null },
    { id: 5, plate: 'WP-CAC-7890', type: 'Compactor Truck', capacity: 8, fuel: 'Diesel', status: 'Available', driver: 'Chamara Dissanayake', nextService: '2026-04-10', zone: null },
    { id: 6, plate: 'NW-NAA-2345', type: 'Water Tanker', capacity: 5, fuel: 'Diesel', status: 'In Use', driver: 'Priyanka Jayawardena', nextService: '2026-05-10', zone: 'Zone 7 – Street Cleaning' },
];

const SEED_MAINTENANCE = [
    { id: 1, plate: 'WP-CAA-1234', service: 'Oil Change', date: '2026-04-15', priority: 'Normal', status: 'Scheduled' },
    { id: 2, plate: 'WP-CAB-5678', service: 'Brake Inspection', date: '2026-05-01', priority: 'Normal', status: 'Scheduled' },
    { id: 3, plate: 'CP-KAA-9012', service: 'Engine Overhaul', date: '2026-02-28', priority: 'High', status: 'In Progress' },
    { id: 4, plate: 'SP-GAA-3456', service: 'Tyre Replacement', date: '2026-04-28', priority: 'Normal', status: 'Scheduled' },
    { id: 5, plate: 'WP-CAC-7890', service: 'Annual Service', date: '2026-04-10', priority: 'Normal', status: 'Scheduled' },
    { id: 6, plate: 'NW-NAA-2345', service: 'Tank Sanitization', date: '2026-03-15', priority: 'Urgent', status: 'Overdue' },
];

const TASKS = [
    { id: 'T-001', zone: 'Zone 1 – Colombo Fort', type: 'General Collection', weight: '3–4 t', reqType: 'Compactor Truck' },
    { id: 'T-002', zone: 'Zone 5 – Nugegoda', type: 'Green Waste', weight: '1–2 t', reqType: 'Mini Loader' },
    { id: 'T-003', zone: 'Zone 9 – Dehiwala', type: 'Bulk Disposal', weight: '10+ t', reqType: 'Roll-Off Truck' },
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

/* ── Modals ── */
const AddVehicleModal = ({ onClose, onAdd }) => {
    const [f, setF] = useState({ plate: '', type: 'Compactor Truck', capacity: '', fuel: 'Diesel', driver: '' });
    const ch = e => setF(p => ({ ...p, [e.target.name]: e.target.value }));
    const submit = e => {
        e.preventDefault();
        onAdd({ ...f, capacity: Number(f.capacity), id: Date.now(), status: 'Available', nextService: '', zone: null });
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
                    <div className="mf-field"><label>Plate Number</label>
                        <input name="plate" placeholder="e.g. WP-CAD-0001" value={f.plate} onChange={ch} required />
                    </div>
                    <div className="mf-row">
                        <div className="mf-field"><label>Type</label>
                            <select name="type" value={f.type} onChange={ch}>
                                {['Compactor Truck', 'Mini Loader', 'Roll-Off Truck', 'Flatbed Truck', 'Water Tanker'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="mf-field"><label>Fuel</label>
                            <select name="fuel" value={f.fuel} onChange={ch}>
                                {['Diesel', 'Electric', 'CNG'].map(t => <option key={t}>{t}</option>)}
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
    const eligible = vehicles.filter(v => v.status === 'Available' && v.type === task.reqType);
    const [sel, setSel] = useState(null);
    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <header className="modal-hdr">
                    <span className="modal-icon-wrap">🗺️</span>
                    <div><h3>Assign Vehicle</h3><p>{task.id} · {task.zone}</p></div>
                    <button className="modal-x" onClick={onClose}>✕</button>
                </header>
                <div className="task-chips">
                    <span className="task-chip">🚛 {task.reqType}</span>
                    <span className="task-chip">⚖️ {task.weight}</span>
                    <span className="task-chip">📦 {task.type}</span>
                </div>
                {eligible.length === 0
                    ? <p className="assign-empty">No available <strong>{task.reqType}</strong> right now.</p>
                    : (<>
                        <p className="assign-pick">Select a vehicle to dispatch:</p>
                        <div className="assign-list">
                            {eligible.map(v => (
                                <div key={v.id} className={`assign-row ${sel === v.id ? 'assign-row-sel' : ''}`} onClick={() => setSel(v.id)}>
                                    <div className="assign-row-left">
                                        <span className="ar-plate">{v.plate}</span>
                                        <span className="ar-detail">{v.driver} · {v.capacity}t · {FUEL_ICON[v.fuel]} {v.fuel}</span>
                                    </div>
                                    {sel === v.id && <span className="ar-check">✓</span>}
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
    const [vehicles, setVehicles] = useState(SEED_VEHICLES);
    const [filterStatus, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [assignTask, setAssign] = useState(null);

    const total = vehicles.length;
    const avail = vehicles.filter(v => v.status === 'Available').length;
    const inUse = vehicles.filter(v => v.status === 'In Use').length;
    const inMaint = vehicles.filter(v => v.status === 'Maintenance').length;

    const filtered = vehicles.filter(v => {
        const okS = filterStatus === 'All' || v.status === filterStatus;
        const q = search.toLowerCase();
        return okS && (!q || v.plate.toLowerCase().includes(q) || v.type.toLowerCase().includes(q) || v.driver.toLowerCase().includes(q));
    });

    const handleAdd = useCallback(v => setVehicles(p => [...p, v]), []);
    const handleStatus = useCallback((id, s) => setVehicles(p => p.map(v => v.id === id ? { ...v, status: s, zone: s !== 'In Use' ? null : v.zone } : v)), []);
    const handleAssign = useCallback((vid, task) => setVehicles(p => p.map(v => v.id === vid ? { ...v, status: 'In Use', zone: task.zone } : v)), []);

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
                                            <th>Vehicle</th>
                                            <th>Type</th>
                                            <th>Cap.</th>
                                            <th>Fuel</th>
                                            <th>Driver</th>
                                            <th>Status</th>
                                            <th>Next Service</th>
                                            <th>Update</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.map(v => (
                                            <tr key={v.id} className="data-row">
                                                <td>
                                                    <div className="plate-cell">
                                                        <div className="plate-icon">🚛</div>
                                                        <div>
                                                            <span className="plate-txt">{v.plate}</span>
                                                            {v.zone && <span className="zone-txt">{v.zone}</span>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="td-mid">{v.type}</td>
                                                <td className="td-mid">{v.capacity}t</td>
                                                <td className="td-mid">{FUEL_ICON[v.fuel]} {v.fuel}</td>
                                                <td className="td-mid">{v.driver}</td>
                                                <td><Pill status={v.status} /></td>
                                                <td className="td-mid td-date">{v.nextService || '—'}</td>
                                                <td>
                                                    <select className="status-sel" value={v.status} onChange={e => handleStatus(v.id, e.target.value)}>
                                                        <option>Available</option>
                                                        <option>In Use</option>
                                                        <option>Maintenance</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                        {filtered.length === 0 && (
                                            <tr><td colSpan="8" className="td-empty">No vehicles match your filter.</td></tr>
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
                                        <span className="assign-col-count">{TASKS.length}</span>
                                    </div>
                                    <div className="assign-col-body">
                                        {TASKS.map(t => {
                                            const can = vehicles.some(v => v.status === 'Available' && v.type === t.reqType);
                                            return (
                                                <div key={t.id} className="task-card">
                                                    <div className="tc-top">
                                                        <span className="tc-id">{t.id}</span>
                                                        <span className="tc-type">{t.type}</span>
                                                    </div>
                                                    <div className="tc-zone">📍 {t.zone}</div>
                                                    <div className="tc-meta">🚛 {t.reqType} · ⚖️ {t.weight}</div>
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
                                            <div key={v.id} className="active-card">
                                                <div className="ac-top">
                                                    <span className="ac-pulse" />
                                                    <span className="ac-plate">{v.plate}</span>
                                                    <Pill status="In Use" />
                                                </div>
                                                <div className="ac-driver">👤 {v.driver}</div>
                                                {v.zone && <div className="ac-zone">📍 {v.zone}</div>}
                                                <div className="ac-type">{v.type} · {v.capacity}t</div>
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
        </div>
    );
}
