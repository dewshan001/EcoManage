import React, { useState, useEffect } from 'react';
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
    'Pending Invoice': { icon: <ClockIcon />, color: 'review' },
    'Pending Payment': { icon: <ClockIcon />, color: 'pending' },
    'Payment Completed': { icon: <CheckCircleIcon />, color: 'approved' },
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

// Remove mock data, we will fetch from backend

const ReportReview = () => {
  const [activeMode, setActiveMode] = useState('review'); // 'review' | 'tasks' | 'dashboard'
  const [complaints, setComplaints] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [taskForm, setTaskForm] = useState({
    priority: 'Medium',
    scheduleDate: '',
    workers: 4,
    vehicleType: 'Compactor Truck',
    taskId: '',
    decision: 'approve', // Only used in 'review' mode
  });

  const getModeFilteredComplaints = () => {
    if (activeMode === 'review') {
      return complaints.filter((c) => ['Pending', 'In Review', 'Rejected'].includes(c.status));
    }
    // For 'tasks' mode, only show approved complaints that don't have a linked task yet
    return complaints.filter((c) => {
      if (c.status !== 'Approved') return false;
      return !c.linkedTaskId;
    });
  };

  const modeComplaints = getModeFilteredComplaints();

  const selectedComplaint = modeComplaints.find((c) => c.id === selectedId) || modeComplaints[0] || null;

  const filteredComplaints = modeComplaints.filter((c) =>
    filter === 'all' ? true : c.status === filter,
  );

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/api/reports');
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }

      const tasksRes = await fetch('http://localhost:5000/api/tasks');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }

      const vehRes = await fetch('http://localhost:5000/api/vehicles');
      if (vehRes.ok) {
        const vehData = await vehRes.json();
        setVehicles(vehData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDeleteTask = (id) => {
    setTaskToDelete(id);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskToDelete && t.taskId !== taskToDelete));
      } else {
        alert('Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task');
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleUpdateTaskStatus = async (task, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${task.taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
      } else {
        alert('Failed to update task status');
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };


  // Auto-select first item when changing modes
  useEffect(() => {
    if (modeComplaints.length > 0) {
      if (!modeComplaints.find(c => c.id === selectedId)) {
        setSelectedId(modeComplaints[0].id);
      }
    } else {
      setSelectedId(null);
    }
  }, [activeMode, complaints]);

  const handleTaskChange = (field, value) => {
    setTaskForm((prev) => ({ ...prev, [field]: value }));
  };

  // Generate random task ID when entering task assignment mode
  const generateTaskId = () => {
    return `TASK-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  const changeMode = (mode) => {
    setActiveMode(mode);
    setFilter('all');

    // Auto-generate task ID if switching to tasks mode and it's empty
    if (mode === 'tasks' && !taskForm.taskId) {
      setTaskForm(prev => ({ ...prev, taskId: generateTaskId() }));
    }
  };

  const handleApplyDecision = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;

    setIsSubmitting(true);

    const { decision, taskId, priority, scheduleDate, workers, vehicleType } = taskForm;
    let payload = {};

    if (activeMode === 'review') {
      const nextStatus = decision === 'approve' ? 'Approved' : 'Rejected';
      payload = { status: nextStatus };
    } else {
      // In Task Assignment Mode
      payload = {
        linkedTaskId: taskId || null,
        priority: priority,
        scheduleDate: scheduleDate,
        workers: workers,
        vehicleType: vehicleType
      };
    }

    try {
      const res = await fetch(`http://localhost:5000/api/reports/${selectedComplaint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Refresh local data
        setComplaints((prev) =>
          prev.map((c) =>
            c.id === selectedComplaint.id
              ? { ...c, ...payload }
              : c
          )
        );

        // Reset form for next decision and auto-generate new ID if in task mode
        setTaskForm((prev) => ({
          ...prev,
          taskId: activeMode === 'tasks' ? generateTaskId() : '',
          scheduleDate: ''
        }));
      }
    } catch (error) {
      console.error('Error applying decision:', error);
    } finally {
      setIsSubmitting(false);
    }
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
            {activeMode === 'review'
              ? 'Verify submitted garbage complaints and approve or reject them based on evidence.'
              : activeMode === 'tasks'
                ? 'Take approved complaints and instantly create structured cleanup tasks linked by Task IDs.'
                : 'View the status of all assigned, ongoing, and completed tasks.'}
          </p>
        </header>

        {/* Global Mode Toggle */}
        <div className="rr-mode-toggle">
          <button
            className={`mode-btn ${activeMode === 'review' ? 'active' : ''}`}
            onClick={() => changeMode('review')}
          >
            Review Complaints
          </button>
          <button
            className={`mode-btn ${activeMode === 'tasks' ? 'active' : ''}`}
            onClick={() => changeMode('tasks')}
          >
            Assign Tasks
          </button>
          <button
            className={`mode-btn ${activeMode === 'dashboard' ? 'active' : ''}`}
            onClick={() => changeMode('dashboard')}
          >
            Task Board
          </button>
        </div>

        {activeMode !== 'dashboard' ? (
          <div className="rr-layout animate-fade-in-up delay-100">
            {/* Complaints Queue Panel */}
            <aside className="rr-sidebar-panel">
              <div className="rr-sidebar-header">
                <div className="rr-sidebar-title-group">
                  <h2 className="rr-sidebar-title">Complaints Queue</h2>
                  <span className="rr-count-badge">{filteredComplaints.length}</span>
                </div>
                <p className="rr-sidebar-subtitle">Review and validate citizen reports</p>
              </div>

              {/* Modern Segmented Filter Bar */}
              <div className="rr-filter-segments">
                {activeMode === 'review' ? (
                  ['all', 'Pending', 'In Review', 'Rejected'].map((f) => (
                    <button
                      key={f}
                      className={`filter-pill ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All Statuses' : f}
                    </button>
                  ))
                ) : (
                  ['all', 'Approved'].map((f) => (
                    <button
                      key={f}
                      className={`filter-pill ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f === 'all' ? 'All Approved' : f}
                    </button>
                  ))
                )}
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
                        <div className="card-id-group">
                          <span className={`status-dot ${c.status.toLowerCase().replace(' ', '-')}`} />
                          <span className="complaint-id">{c.reportId}</span>
                        </div>
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
                          {formatDate(c.date || c.createdAt)}
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

            {/* Detail & Task Creation Panel */}
            <section className="rr-content-panel">
              {isLoading ? (
                <div className="empty-selection">
                  <div className="loader-pulse"></div>
                  <p>Loading complaints...</p>
                </div>
              ) : selectedComplaint ? (
                <>
                  <div className="rr-content-header">
                    <div className="rr-content-title-group">
                      <h2 className="rr-content-title">{selectedComplaint.location}</h2>
                      <p className="rr-content-subtitle">
                        Report ID: {selectedComplaint.reportId} • Citizen: {selectedComplaint.citizenName || 'Anonymous'}
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
                            {formatDate(selectedComplaint.date || selectedComplaint.createdAt)}
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

                    {/* Right: Task Creation OR Decision */}
                    <div className="rr-task-section">
                      <div className="task-creation-card">
                        <div className="task-card-header">
                          <h3>{activeMode === 'review' ? 'Report Decision' : 'Task Assignment'}</h3>
                          <p>
                            {activeMode === 'review'
                              ? 'Review the evidence and decide the status of this complaint.'
                              : 'Define cleanup task parameters and link to this approved complaint.'}
                          </p>
                        </div>

                        <form className="task-form" onSubmit={handleApplyDecision}>

                          {activeMode === 'review' ? (
                            <>
                              {/* Decision Toggle - Only in Review Mode */}
                              <div className="form-group">
                                <label className="form-label">Decision</label>
                                <div className="decision-toggle-group">
                                  <button
                                    type="button"
                                    className={`decision-toggle approve ${taskForm.decision === 'approve' ? 'active' : ''}`}
                                    onClick={() => handleTaskChange('decision', 'approve')}
                                  >
                                    <CheckCircleIcon /> Approve Report
                                  </button>
                                  <button
                                    type="button"
                                    className={`decision-toggle reject ${taskForm.decision === 'reject' ? 'active' : ''}`}
                                    onClick={() => handleTaskChange('decision', 'reject')}
                                  >
                                    <XCircleIcon /> Reject Report
                                  </button>
                                </div>
                              </div>

                              <button type="submit" className={`btn-submit ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                                {isSubmitting ? 'Processing...' : taskForm.decision === 'approve' ? (
                                  <>
                                    <CheckCircleIcon /> Confirm Approval
                                  </>
                                ) : (
                                  <>
                                    <XCircleIcon /> Confirm Rejection
                                  </>
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              {/* Task Form - Only in Tasks Mode */}
                              <div className="form-group">
                                <label className="form-label" htmlFor="taskId" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span>Task ID</span>
                                  <button
                                    type="button"
                                    onClick={() => setTaskForm(prev => ({ ...prev, taskId: generateTaskId() }))}
                                    style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                                  >
                                    ↻ Generate New
                                  </button>
                                </label>
                                <input
                                  type="text"
                                  id="taskId"
                                  className="form-input"
                                  placeholder="e.g., TASK-1234"
                                  value={taskForm.taskId}
                                  onChange={(e) => handleTaskChange('taskId', e.target.value)}
                                  required
                                />
                                <span className="form-hint">
                                  Unique identifier to link this task with the complaint
                                </span>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label className="form-label" htmlFor="priority">
                                    <AlertCircleIcon /> Priority Level
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
                                    <CalendarIcon /> Schedule Date
                                  </label>
                                  <input
                                    type="date"
                                    id="scheduleDate"
                                    className="form-input"
                                    value={taskForm.scheduleDate}
                                    onChange={(e) => handleTaskChange('scheduleDate', e.target.value)}
                                    required
                                  />
                                </div>
                              </div>

                              <div className="form-row">
                                <div className="form-group">
                                  <label className="form-label" htmlFor="workers">
                                    <UsersIcon /> Required Workers
                                  </label>
                                  <input
                                    type="number"
                                    id="workers"
                                    min="1"
                                    max="50"
                                    className="form-input"
                                    value={taskForm.workers}
                                    onChange={(e) => handleTaskChange('workers', e.target.value)}
                                    required
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label" htmlFor="vehicleType">
                                    <TruckIcon /> Vehicle Type
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

                              {(() => {
                                const hasAvailableVehicle = vehicles.some(v => v.status === 'Available' && v.type === taskForm.vehicleType);
                                return (
                                  <>
                                    {!hasAvailableVehicle && (
                                      <div style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '10px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <AlertCircleIcon /> No available vehicle of this type. Task creation disabled.
                                      </div>
                                    )}
                                    <button type="submit" className={`btn-submit ${isSubmitting || !hasAvailableVehicle ? 'loading' : ''}`} disabled={isSubmitting || !hasAvailableVehicle} style={{ opacity: (!hasAvailableVehicle && !isSubmitting) ? 0.6 : 1, cursor: (!hasAvailableVehicle && !isSubmitting) ? 'not-allowed' : 'pointer' }}>
                                      {isSubmitting ? 'Processing...' : (
                                        <>
                                          <CheckCircleIcon /> Link & Create Task
                                        </>
                                      )}
                                    </button>
                                  </>
                                );
                              })()}
                            </>
                          )}
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
        ) : (
          <div className="rr-layout animate-fade-in-up delay-100" style={{ display: 'block' }}>
            <div className="task-board">
              <div className="task-board-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>System Activity Log</h2>
                <div className="rr-filter-segments" style={{ margin: 0 }}>
                  {['all', 'Pending Vehicle', 'Assigned', 'Active', 'Completed', 'Pending Invoice', 'Pending Payment', 'Payment Completed'].map((f) => (
                    <button
                      key={f}
                      className={`filter-pill ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                      style={{ margin: 0 }}
                    >
                      {f === 'all' ? 'All Tasks' : f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="task-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '1.5rem'
              }}>
                {tasks
                  .filter(t => filter === 'all' ? true : t.status === filter)
                  .map(task => (
                    <div key={task.id} className="task-card" style={{
                      background: 'var(--card-bg)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: 'var(--shadow-sm)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div className="task-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="task-id-badge" style={{
                          background: 'var(--bg-lighter)',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '0.85rem',
                          color: 'var(--primary-color)'
                        }}>
                          {task.taskId}
                        </div>
                        <StatusBadge status={task.status} />
                      </div>

                      <div className="task-details">
                        <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>{task.location || 'Unknown Location'}</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.description || 'General maintenance task'}
                        </p>
                      </div>

                      <div className="summary-tags" style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                        <PriorityBadge priority={task.priority} />
                        {task.scheduleDate && (
                          <span className="summary-tag"><CalendarIcon /> {task.scheduleDate.split('T')[0]}</span>
                        )}
                        <span className="summary-tag"><TruckIcon /> {task.vehicleType || 'Not specified'}</span>
                      </div>

                      <div className="task-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', flexWrap: 'wrap', gap: '8px' }}>
                        <div className="task-meta-item" style={{ color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <UsersIcon /> {task.assignedTo ? `Worker: ${task.assignedTo}` : 'Unassigned'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>

                          {/* Status label for billing-pipeline statuses (read-only in task board) */}
                          {['Pending Invoice', 'Pending Payment', 'Payment Completed'].includes(task.status) ? (
                            <span style={{
                              padding: '3px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600',
                              background: task.status === 'Payment Completed' ? '#ecfdf5' : task.status === 'Pending Payment' ? '#fef3c7' : '#eff6ff',
                              color: task.status === 'Payment Completed' ? '#059669' : task.status === 'Pending Payment' ? '#d97706' : '#2563eb',
                              border: `1px solid ${task.status === 'Payment Completed' ? '#a7f3d0' : task.status === 'Pending Payment' ? '#fde68a' : '#bfdbfe'}`
                            }}>
                              {task.status}
                            </span>
                          ) : (
                            <>
                              {/* Status dropdown for pre-billing statuses */}
                              <select
                                value={task.status}
                                onChange={e => handleUpdateTaskStatus(task, e.target.value)}
                                title="Update status"
                                style={{
                                  fontSize: '0.78rem', padding: '4px 8px', borderRadius: '6px',
                                  border: '1px solid #d1d5db', background: '#f9fafb',
                                  color: '#374151', cursor: 'pointer', outline: 'none'
                                }}
                              >
                                <option value="Pending Vehicle">Pending Vehicle</option>
                                <option value="Pending">Pending</option>
                                <option value="Assigned">Assigned</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed ✓</option>
                              </select>

                              {/* Quick Complete → sends to billing pipeline */}
                              <button
                                onClick={() => handleUpdateTaskStatus(task, 'Pending Invoice')}
                                title="Mark as Completed (moves to Pending Invoice)"
                                style={{
                                  background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669',
                                  cursor: 'pointer', padding: '4px 10px', borderRadius: '6px',
                                  display: 'flex', alignItems: 'center', gap: '4px',
                                  fontSize: '0.78rem', fontWeight: '600'
                                }}
                              >
                                <CheckCircleIcon /> Complete
                              </button>
                            </>
                          )}

                          <div className="task-meta-item" style={{ color: 'var(--text-light)' }}>
                            Linked: <strong>{task.reportId}</strong>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete Task"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                {tasks.length === 0 && (
                  <div className="empty-selection" style={{ gridColumn: '1 / -1', padding: '4rem 2rem' }}>
                    <div className="empty-selection-icon">📋</div>
                    <h3>No tasks found</h3>
                    <p>There are currently no tasks matching your filters.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Task Confirmation Modal */}
      {taskToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setTaskToDelete(null)}>
          <div style={{ background: 'var(--card-bg, #fff)', borderRadius: '16px', padding: '2rem', maxWidth: '400px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>⚠️</span>
              <h3 style={{ margin: 0, color: '#dc2626' }}>Delete Task</h3>
            </div>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--text-mid, #555)', fontSize: '0.95rem' }}>Are you sure you want to delete this task? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setTaskToDelete(null)} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color, #ddd)', background: 'transparent', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
              <button onClick={confirmDeleteTask} style={{ padding: '0.5rem 1.25rem', borderRadius: '8px', border: '1px solid #b91c1c', background: '#dc2626', color: '#fff', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportReview;
