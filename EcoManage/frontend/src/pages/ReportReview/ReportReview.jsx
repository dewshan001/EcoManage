import React, { useState } from 'react';
import './ReportReview.css';

// SVG Icons
const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

// Badge helpers
const StatusBadge = ({ status }) => {
  const configs = {
    Pending: { icon: <ClockIcon />, color: 'pending' },
    'In Review': { icon: <AlertCircleIcon />, color: 'review' },
    Approved: { icon: <CheckCircleIcon />, color: 'approved' },
    Rejected: { icon: <XCircleIcon />, color: 'rejected' },
  };
  const config = configs[status] || configs.Pending;
  return (
    <span className={`status-badge ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};

const PriorityBadge = ({ priority }) => (
  <span className={`priority-badge priority-${priority.toLowerCase()}`}>{priority}</span>
);

const VEHICLE_TYPES = ['Compactor Truck', 'Mini Loader', 'Roll-Off Truck', 'Flatbed Truck'];

// Seed complaints to review (mock data for UI)
const INITIAL_COMPLAINTS = [
  {
    id: 'C-10293',
    reportId: 'REP-10293',
    citizenName: 'Anonymous',
    location: 'Main St & 4th Ave, Colombo 03',
    description:
      'Large pile of electronic waste dumped near the park entrance. Cables, screens and plastic parts scattered around.',
    imageUrl:
      'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-02-27T10:30:00',
    status: 'Pending',
    linkedTaskId: null,
  },
  {
    id: 'C-10291',
    reportId: 'REP-10291',
    citizenName: 'Anonymous',
    location: 'Galle Road, Mount Lavinia',
    description: 'Overflowing public bins by the bus stop. Waste spilling onto the pavement.',
    imageUrl:
      'https://images.unsplash.com/photo-1605600659908-0ef719419d41?q=80&w=600&auto=format&fit=crop',
    createdAt: '2026-02-25T14:15:00',
    status: 'In Review',
    linkedTaskId: 'T-0451',
  },
];

const ReportReview = () => {
  const [complaints, setComplaints] = useState(INITIAL_COMPLAINTS);
  const [selectedId, setSelectedId] = useState(INITIAL_COMPLAINTS[0]?.id || null);
  const [filter, setFilter] = useState('all');

  const [taskForm, setTaskForm] = useState({
    priority: 'Medium',
    scheduleDate: '',
    workers: 4,
    vehicleType: 'Compactor Truck',
    taskId: '',
    decision: 'approve',
  });

  const selectedComplaint = complaints.find((c) => c.id === selectedId) || complaints[0] || null;

  const filteredComplaints = complaints.filter((c) =>
    filter === 'all' ? true : c.status === filter,
  );

  const handleTaskChange = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyDecision = (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    const { decision, taskId, priority, scheduleDate, workers, vehicleType } = taskForm;

    setComplaints((prev) =>
      prev.map((c) => {
        if (c.id !== selectedComplaint.id) return c;

        const nextStatus = decision === 'approve' ? 'Approved' : 'Rejected';

        return {
          ...c,
          status: nextStatus,
          linkedTaskId: decision === 'approve' && taskId ? taskId : c.linkedTaskId,
          lastDecision: {
            decision,
            priority,
            scheduleDate,
            workers,
            vehicleType,
          },
        };
      }),
    );
  };

  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  return (
    <div className="rr-page">
      {/* Background decorations */}
      <div className="rr-bg-shape rr-shape-1"></div>
      <div className="rr-bg-shape rr-shape-2"></div>
      <div className="rr-bg-shape rr-shape-3"></div>

      <div className="rr-wrapper animate-fade-in-up">
        <header className="rr-header">
          <span className="section-tag dark">OFFICER CONSOLE</span>
          <h1 className="rr-title">Report Review & Task Creation</h1>
          <p className="rr-subtitle">
            Verify submitted garbage complaints, approve or reject them based on evidence, and
            instantly create structured cleanup tasks linked by Task IDs.
          </p>
        </header>

        <div className="rr-main-card animate-fade-in-up delay-100">
          <div className="rr-layout">
            {/* Complaints Queue */}
            <aside className="rr-sidebar">
              <div className="rr-sidebar-header">
                <div className="rr-sidebar-title-group">
                  <h2 className="rr-sidebar-title">Complaints Queue</h2>
                  <span className="rr-count-badge">{filteredComplaints.length}</span>
                </div>
                <p className="rr-sidebar-subtitle">Review and validate citizen reports</p>
              </div>

              <div className="rr-filter-bar">
                <select
                  className="rr-filter-select"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="rr-complaints-list">
                {filteredComplaints.map((c) => (
                  <div
                    key={c.id}
                    className={`complaint-card ${selectedComplaint?.id === c.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    {c.imageUrl && (
                      <div className="complaint-thumbnail">
                        <img src={c.imageUrl} alt="Report" />
                        <div className="thumbnail-overlay"></div>
                      </div>
                    )}
                    <div className="complaint-content">
                      <div className="complaint-header">
                        <span className="complaint-id">{c.reportId}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      <h3 className="complaint-location">
                        <MapPinIcon />
                        {c.location}
                      </h3>
                      <p className="complaint-preview">{c.description}</p>
                      <div className="complaint-meta">
                        <span className="meta-item">
                          <CalendarIcon />
                          {formatDate(c.createdAt)}
                        </span>
                        {c.linkedTaskId && (
                          <span className="meta-linked">→ {c.linkedTaskId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredComplaints.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">🍃</div>
                    <h3>No complaints found</h3>
                    <p>Try adjusting your filters</p>
                  </div>
                )}
              </div>
            </aside>

            {/* Detail & Task Creation */}
            <section className="rr-content">
              {selectedComplaint ? (
                <>
                  <div className="rr-content-header">
                    <div className="rr-content-title-group">
                      <h2 className="rr-content-title">{selectedComplaint.location}</h2>
                      <p className="rr-content-subtitle">
                        Report ID: {selectedComplaint.reportId} • Citizen: {selectedComplaint.citizenName}
                      </p>
                    </div>
                    <div className="rr-status-group">
                      <StatusBadge status={selectedComplaint.status} />
                      {selectedComplaint.linkedTaskId && (
                        <span className="linked-task-badge">
                          Task: {selectedComplaint.linkedTaskId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rr-content-grid">
                    {/* Left: Description & Image */}
                    <div className="rr-evidence-section">
                      <div className="evidence-card">
                        <div className="evidence-header">
                          <h3>Description & Details</h3>
                          <span className="evidence-date">
                            <CalendarIcon />
                            {formatDate(selectedComplaint.createdAt)}
                          </span>
                        </div>
                        <p className="evidence-description">{selectedComplaint.description}</p>
                      </div>

                      <div className="evidence-card image-card">
                        <h3>Photo Evidence</h3>
                        {selectedComplaint.imageUrl ? (
                          <div className="evidence-image-wrapper">
                            <img
                              src={selectedComplaint.imageUrl}
                              alt="Complaint evidence"
                              className="evidence-image"
                            />
                          </div>
                        ) : (
                          <div className="no-image-state">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <p>No image attached</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Task Creation */}
                    <div className="rr-task-section">
                      <div className="task-creation-card">
                        <div className="task-card-header">
                          <h3>Task Creation & Decision</h3>
                          <p>Define cleanup task parameters and link to this complaint</p>
                        </div>

                        <form className="task-form" onSubmit={handleApplyDecision}>
                          {/* Decision Toggle */}
                          <div className="form-group">
                            <label className="form-label">Decision</label>
                            <div className="decision-toggle-group">
                              <button
                                type="button"
                                className={`decision-toggle approve ${
                                  taskForm.decision === 'approve' ? 'active' : ''
                                }`}
                                onClick={() => handleTaskChange('decision', 'approve')}
                              >
                                <CheckCircleIcon />
                                Approve Report
                              </button>
                              <button
                                type="button"
                                className={`decision-toggle reject ${
                                  taskForm.decision === 'reject' ? 'active' : ''
                                }`}
                                onClick={() => handleTaskChange('decision', 'reject')}
                              >
                                <XCircleIcon />
                                Reject Report
                              </button>
                            </div>
                          </div>

                          {/* Task ID */}
                          <div className="form-group">
                            <label className="form-label" htmlFor="taskId">
                              Task ID
                            </label>
                            <input
                              type="text"
                              id="taskId"
                              className="form-input"
                              placeholder="e.g., T-0451"
                              value={taskForm.taskId}
                              onChange={(e) => handleTaskChange('taskId', e.target.value)}
                            />
                            <span className="form-hint">
                              Unique identifier to link this task with the complaint
                            </span>
                          </div>

                          {/* Priority & Schedule Date */}
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label" htmlFor="priority">
                                <AlertCircleIcon />
                                Priority Level
                              </label>
                              <select
                                id="priority"
                                className="form-input"
                                value={taskForm.priority}
                                onChange={(e) => handleTaskChange('priority', e.target.value)}
                              >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="scheduleDate">
                                <CalendarIcon />
                                Schedule Date
                              </label>
                              <input
                                type="date"
                                id="scheduleDate"
                                className="form-input"
                                value={taskForm.scheduleDate}
                                onChange={(e) => handleTaskChange('scheduleDate', e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Workers & Vehicle Type */}
                          <div className="form-row">
                            <div className="form-group">
                              <label className="form-label" htmlFor="workers">
                                <UsersIcon />
                                Required Workers
                              </label>
                              <input
                                type="number"
                                id="workers"
                                min="1"
                                max="50"
                                className="form-input"
                                value={taskForm.workers}
                                onChange={(e) => handleTaskChange('workers', e.target.value)}
                              />
                            </div>
                            <div className="form-group">
                              <label className="form-label" htmlFor="vehicleType">
                                <TruckIcon />
                                Vehicle Type
                              </label>
                              <select
                                id="vehicleType"
                                className="form-input"
                                value={taskForm.vehicleType}
                                onChange={(e) => handleTaskChange('vehicleType', e.target.value)}
                              >
                                {VEHICLE_TYPES.map((v) => (
                                  <option key={v} value={v}>
                                    {v}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Task Summary */}
                          <div className="task-summary">
                            <div className="summary-header">
                              <span>Task Summary</span>
                            </div>
                            <div className="summary-tags">
                              <PriorityBadge priority={taskForm.priority} />
                              {taskForm.scheduleDate && (
                                <span className="summary-tag">
                                  <CalendarIcon />
                                  {taskForm.scheduleDate}
                                </span>
                              )}
                              <span className="summary-tag">
                                <UsersIcon />
                                {taskForm.workers} workers
                              </span>
                              <span className="summary-tag">
                                <TruckIcon />
                                {taskForm.vehicleType}
                              </span>
                            </div>
                          </div>

                          {/* Submit Button */}
                          <button type="submit" className="btn-submit">
                            {taskForm.decision === 'approve' ? (
                              <>
                                <CheckCircleIcon />
                                Approve & Create Task
                              </>
                            ) : (
                              <>
                                <XCircleIcon />
                                Reject Complaint
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="empty-selection">
                  <div className="empty-selection-icon">🍃</div>
                  <h3>No complaint selected</h3>
                  <p>Select a complaint from the queue to review and create tasks</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReview;
