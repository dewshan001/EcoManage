import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, FileText, CheckCircle, Clock, Plus,
    DollarSign, Activity, Trash2, Loader, AlertCircle,
    RefreshCw, ChevronRight, User, MapPin, Truck
} from 'lucide-react';
import './Billing.css';

const API = 'http://localhost:5000/api';

const DEFAULT_FEES = {
    'General Waste': { wasteFee: 20, laborFee: 15, vehicleFee: 25 },
    'Bulk Waste': { wasteFee: 50, laborFee: 30, vehicleFee: 40 },
    'Hazardous Waste': { wasteFee: 100, laborFee: 50, vehicleFee: 60 },
    'Recyclables': { wasteFee: 10, laborFee: 10, vehicleFee: 15 }
};

const getUserFromSession = () => {
    try { return JSON.parse(sessionStorage.getItem('user')); }
    catch { return null; }
};

const isAdminOrManager = (user) => {
    if (!user) return false;
    const r = (user.role || '').toLowerCase();
    return r === 'admin' || r === 'manager' || r === 'garbagemanager';
};

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
const Billing = () => {
    const user = getUserFromSession();
    const viewMode = isAdminOrManager(user) ? 'admin' : 'resident';

    /* ── state ── */
    const [invoices, setInvoices] = useState([]);
    const [availableTasks, setAvailableTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [notification, setNotification] = useState(null);

    /* ── payment modal state ── */
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [payingInvoice, setPayingInvoice] = useState(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        cardholderName: '',
        cardNumber: '',
        expiry: '',
        cvv: '',
    });

    /* ── invoice form state ── */
    const [selectedTask, setSelectedTask] = useState(null); // full task object
    const [taskType, setTaskType] = useState('General Waste');
    const [wasteFee, setWasteFee] = useState('');
    const [laborFee, setLaborFee] = useState('');
    const [vehicleFee, setVehicleFee] = useState('');

    /* ─── helpers ─── */
    const toast = (type, msg) => {
        setNotification({ type, msg });
        setTimeout(() => setNotification(null), 3500);
    };

    const applyDefaultFees = (type) => {
        const f = DEFAULT_FEES[type] || { wasteFee: 0, laborFee: 0, vehicleFee: 0 };
        setWasteFee(f.wasteFee);
        setLaborFee(f.laborFee);
        setVehicleFee(f.vehicleFee);
    };

    const handleTaskTypeChange = (t) => { setTaskType(t); applyDefaultFees(t); };

    const previewTotal = (parseFloat(wasteFee) || 0)
        + (parseFloat(laborFee) || 0)
        + (parseFloat(vehicleFee) || 0);

    const openForm = () => {
        setSelectedTask(null);
        setTaskType('General Waste');
        applyDefaultFees('General Waste');
        setShowForm(true);
    };

    /* ─── data fetching ─── */
    const fetchInvoices = useCallback(async () => {
        try {
            const url = viewMode === 'admin'
                ? `${API}/billing`
                : `${API}/billing/resident/${user?.id}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch invoices');
            const data = await res.json();
            setInvoices(Array.isArray(data) ? data : []);
            setError(null);
        } catch {
            setError('Could not load invoices. Please check if the server is running.');
        }
    }, [viewMode, user?.id]);

    const fetchAvailableTasks = useCallback(async () => {
        if (viewMode !== 'admin') return;
        try {
            const res = await fetch(`${API}/billing/available-tasks`);
            const data = await res.json();
            setAvailableTasks(Array.isArray(data) ? data : []);
        } catch { setAvailableTasks([]); }
    }, [viewMode]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            // Silently promote any legacy tasks to Pending Invoice status
            if (viewMode === 'admin') {
                fetch(`${API}/billing/migrate-tasks`).catch(() => { });
            }
            await Promise.all([fetchInvoices(), fetchAvailableTasks()]);
            setLoading(false);
        };
        init();
    }, [fetchInvoices, fetchAvailableTasks]);

    /* ─── when a task row is clicked ─── */
    const handleSelectTask = (task) => {
        setSelectedTask(task);
        // Auto-pick task type from vehicleType or description heuristics
        const desc = (task.description || '').toLowerCase();
        let matched = 'General Waste';
        for (const t of Object.keys(DEFAULT_FEES)) {
            if (desc.includes(t.toLowerCase())) { matched = t; break; }
        }
        setTaskType(matched);
        applyDefaultFees(matched);
    };

    /* ─── submit invoice ─── */
    const handleGenerateInvoice = async () => {
        if (!selectedTask) { toast('error', 'Please select a task first.'); return; }
        if (!selectedTask.residentId) { toast('error', 'This task has no linked resident. Cannot create invoice.'); return; }

        setSubmitting(true);
        try {
            const payload = {
                taskId: selectedTask.taskId,
                residentId: selectedTask.residentId,
                residentName: selectedTask.residentName || 'Unknown',
                taskType,
                wasteFee: parseFloat(wasteFee) || 0,
                laborFee: parseFloat(laborFee) || 0,
                vehicleFee: parseFloat(vehicleFee) || 0,
            };
            const res = await fetch(`${API}/billing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
            await Promise.all([fetchInvoices(), fetchAvailableTasks()]);
            setShowForm(false);
            setSelectedTask(null);
            toast('success', 'Invoice created and sent to the resident!');
        } catch (err) { toast('error', err.message || 'Failed to create invoice.'); }
        finally { setSubmitting(false); }
    };

    /* ─── open payment modal ─── */
    const handlePayNow = (invoice) => {
        setPayingInvoice(invoice);
        setCardDetails({ cardholderName: '', cardNumber: '', expiry: '', cvv: '' });
        setPaymentSuccess(false);
        setShowPaymentModal(true);
    };

    /* ─── card input formatters ─── */
    const formatCardNumber = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
        return digits;
    };

    const detectCardType = (num) => {
        const n = num.replace(/\s/g, '');
        if (/^4/.test(n)) return 'visa';
        if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard';
        if (/^3[47]/.test(n)) return 'amex';
        if (/^6(?:011|5)/.test(n)) return 'discover';
        return 'unknown';
    };

    /* ─── complete payment ─── */
    const handleCompletePayment = async () => {
        const { cardholderName, cardNumber, expiry, cvv } = cardDetails;
        const rawCard = cardNumber.replace(/\s/g, '');

        if (!cardholderName.trim()) { toast('error', 'Please enter the cardholder name.'); return; }
        if (rawCard.length < 13 || rawCard.length > 19) { toast('error', 'Please enter a valid card number.'); return; }
        if (!/^\d{2}\/\d{2}$/.test(expiry)) { toast('error', 'Please enter a valid expiry date (MM/YY).'); return; }
        const [mm, yy] = expiry.split('/').map(Number);
        const now = new Date();
        const expDate = new Date(2000 + yy, mm - 1, 1);
        if (mm < 1 || mm > 12 || expDate < new Date(now.getFullYear(), now.getMonth(), 1)) {
            toast('error', 'Card has expired or expiry date is invalid.'); return;
        }
        if (cvv.length < 3) { toast('error', 'Please enter a valid CVV.'); return; }

        setProcessingPayment(true);
        try {
            // Simulate brief processing delay for realism
            await new Promise(r => setTimeout(r, 1800));

            const res = await fetch(`${API}/billing/${payingInvoice.invoiceId}/pay`, { method: 'PUT' });
            if (!res.ok) { const e = await res.json(); throw new Error(e.message); }

            setPaymentSuccess(true);
            await fetchInvoices();
            setTimeout(() => {
                setShowPaymentModal(false);
                setPayingInvoice(null);
                setPaymentSuccess(false);
                toast('success', 'Payment completed successfully! Thank you.');
            }, 2000);
        } catch (err) {
            toast('error', err.message || 'Payment failed. Please try again.');
        } finally {
            setProcessingPayment(false);
        }
    };

    /* ─── delete invoice (admin) ─── */
    const handleDelete = async (invoiceId) => {
        if (!window.confirm('Delete this invoice?')) return;
        try {
            const res = await fetch(`${API}/billing/${invoiceId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            await Promise.all([fetchInvoices(), fetchAvailableTasks()]);
            toast('success', 'Invoice deleted.');
        } catch { toast('error', 'Failed to delete invoice.'); }
    };

    /* ─── stats ─── */
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Unpaid').reduce((s, i) => s + i.total, 0);

    /* ════════════════════════ RENDER ════════════════════════ */
    return (
        <div className="billing-container">
            {/* Toast */}
            {notification && (
                <div className={`billing-notification ${notification.type}`}>
                    {notification.type === 'success'
                        ? <CheckCircle size={16} />
                        : <AlertCircle size={16} />}
                    {notification.msg}
                </div>
            )}

            {/* Header */}
            <div className="billing-header">
                <div className="billing-title">
                    <h1>Services Payment &amp; Billings</h1>
                    <p>
                        {viewMode === 'admin'
                            ? 'Create invoices for completed tasks and monitor payments'
                            : 'View and pay your waste collection invoices'}
                    </p>
                </div>
                <button className="btn-refresh" onClick={() => { fetchInvoices(); fetchAvailableTasks(); }} title="Refresh">
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Admin stats */}
            {viewMode === 'admin' && (
                <div className="billing-stats">
                    <div className="stat-card">
                        <div className="stat-icon revenue"><DollarSign /></div>
                        <div className="stat-info">
                            <h3>Total Revenue</h3>
                            <p>${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon pending"><Clock /></div>
                        <div className="stat-info">
                            <h3>Pending Payments</h3>
                            <p>${pendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon total"><Activity /></div>
                        <div className="stat-info">
                            <h3>Total Invoices</h3>
                            <p>{invoices.length}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Generate Invoice Panel ── */}
            {viewMode === 'admin' && (
                <div className="invoices-section" style={{ marginBottom: '24px' }}>
                    <div className="billing-section-header">
                        <h2>Generate Invoice</h2>
                        <button
                            className="btn-primary"
                            onClick={() => showForm ? setShowForm(false) : openForm()}
                        >
                            <Plus size={18} />
                            {showForm ? 'Cancel' : 'New Invoice'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="generate-invoice-card">
                            {/* ── Step 1: Task picker ── */}
                            <div className="step-label">
                                <span className="step-num">1</span>
                                Select a Completed Task
                                <span className="step-hint">Only tasks without an existing invoice are listed</span>
                            </div>

                            {availableTasks.length === 0 ? (
                                <div className="no-tasks-msg">
                                    <CheckCircle size={22} style={{ color: '#10b981' }} />
                                    No completed tasks waiting for an invoice.
                                </div>
                            ) : (
                                <div className="task-picker-table-wrapper">
                                    <table className="task-picker-table">
                                        <thead>
                                            <tr>
                                                <th></th>
                                                <th>Task ID</th>
                                                <th>Location / Description</th>
                                                <th>Resident</th>
                                                <th>Vehicle</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {availableTasks.map(task => (
                                                <tr
                                                    key={task.taskId}
                                                    className={`task-row ${selectedTask?.taskId === task.taskId ? 'selected' : ''}`}
                                                    onClick={() => handleSelectTask(task)}
                                                >
                                                    <td>
                                                        <div className={`radio-dot ${selectedTask?.taskId === task.taskId ? 'active' : ''}`} />
                                                    </td>
                                                    <td className="task-id-bold">{task.taskId}</td>
                                                    <td>
                                                        <div className="task-loc">
                                                            <MapPin size={13} />
                                                            {task.location || task.description || '—'}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="task-loc">
                                                            <User size={13} />
                                                            {task.residentName || <span style={{ color: '#ef4444' }}>No resident</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="task-loc">
                                                            <Truck size={13} />
                                                            {task.vehicleType || '—'}
                                                        </div>
                                                    </td>
                                                    <td>{task.scheduleDate || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* ── Step 2: Charges ── */}
                            {selectedTask && (
                                <>
                                    <div className="step-label" style={{ marginTop: '28px' }}>
                                        <span className="step-num">2</span>
                                        Set Charges for Task&nbsp;
                                        <strong>{selectedTask.taskId}</strong>
                                        &nbsp;→&nbsp;
                                        <span style={{ color: '#10b981' }}>{selectedTask.residentName || 'Unknown'}</span>
                                    </div>

                                    <div className="form-grid" style={{ marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label>Waste / Task Type</label>
                                            <select value={taskType} onChange={e => handleTaskTypeChange(e.target.value)}>
                                                {Object.keys(DEFAULT_FEES).map(t => (
                                                    <option key={t} value={t}>{t}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Waste Type Fee ($)</label>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={wasteFee}
                                                onChange={e => setWasteFee(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Labor Fee ($)</label>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={laborFee}
                                                onChange={e => setLaborFee(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Vehicle Fee ($)</label>
                                            <input
                                                type="number" min="0" step="0.01"
                                                value={vehicleFee}
                                                onChange={e => setVehicleFee(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="fee-breakdown">
                                        <div className="fee-row"><span>Waste Type Fee</span><span>${(parseFloat(wasteFee) || 0).toFixed(2)}</span></div>
                                        <div className="fee-row"><span>Labor Fee</span><span>${(parseFloat(laborFee) || 0).toFixed(2)}</span></div>
                                        <div className="fee-row"><span>Vehicle Fee</span><span>${(parseFloat(vehicleFee) || 0).toFixed(2)}</span></div>
                                        <div className="fee-row total-row"><span>Total</span><span>${previewTotal.toFixed(2)}</span></div>
                                    </div>

                                    <div className="invoice-recipient-banner">
                                        <ChevronRight size={16} />
                                        Invoice will be sent to&nbsp;<strong>{selectedTask.residentName || 'Unknown'}</strong>
                                        {selectedTask.residentEmail && <span className="resident-email">&nbsp;({selectedTask.residentEmail})</span>}
                                    </div>

                                    <button className="btn-primary" onClick={handleGenerateInvoice} disabled={submitting}>
                                        {submitting ? <Loader size={16} className="spin" /> : <FileText size={18} />}
                                        {submitting ? 'Creating...' : 'Generate & Send Invoice'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Invoice List ── */}
            <div className="invoices-section">
                <div className="billing-section-header">
                    <h2>{viewMode === 'resident' ? 'My Invoices' : 'All Invoices'}</h2>
                </div>

                {loading ? (
                    <div className="billing-loading">
                        <Loader size={32} className="spin" />
                        <p>Loading invoices…</p>
                    </div>
                ) : error ? (
                    <div className="billing-error">
                        <AlertCircle size={32} />
                        <p>{error}</p>
                        <button className="btn-primary" onClick={fetchInvoices}>Retry</button>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table className="invoices-table">
                            <thead>
                                <tr>
                                    <th>Invoice ID</th>
                                    <th>Date</th>
                                    {viewMode === 'admin' && <th>Resident</th>}
                                    {viewMode === 'admin' && <th>Task ID</th>}
                                    <th>Task Type</th>
                                    <th>Breakdown (Waste / Labor / Vehicle)</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.length === 0 ? (
                                    <tr>
                                        <td colSpan={viewMode === 'admin' ? 9 : 7} className="empty-cell">
                                            <FileText size={36} style={{ opacity: 0.25, marginBottom: 8 }} />
                                            <p>No invoices found.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map(inv => (
                                        <tr key={inv.id}>
                                            <td className="invoice-id">{inv.invoiceId}</td>
                                            <td>{inv.createdAt?.split('T')[0] ?? '—'}</td>
                                            {viewMode === 'admin' && <td>{inv.residentName || '—'}</td>}
                                            {viewMode === 'admin' && <td className="task-id-cell">{inv.taskId || '—'}</td>}
                                            <td>{inv.taskType}</td>
                                            <td className="breakdown-cell">
                                                ${(inv.wasteFee ?? 0).toFixed(2)} / ${(inv.laborFee ?? 0).toFixed(2)} / ${(inv.vehicleFee ?? 0).toFixed(2)}
                                            </td>
                                            <td className="total-cell">${(inv.total ?? 0).toFixed(2)}</td>
                                            <td>
                                                <span className={`status-badge ${inv.status.toLowerCase()}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-group">
                                                    {inv.status === 'Unpaid' && viewMode === 'resident' && (
                                                        <button className="action-btn pay-btn" onClick={() => handlePayNow(inv)}>
                                                            <CreditCard size={14} /> Pay Now
                                                        </button>
                                                    )}
                                                    {inv.status === 'Unpaid' && viewMode === 'admin' && (
                                                        <span className="pending-label">
                                                            <Clock size={14} /> Awaiting Payment
                                                        </span>
                                                    )}
                                                    {inv.status === 'Paid' && (
                                                        <span className="paid-label">
                                                            <CheckCircle size={16} /> Paid
                                                        </span>
                                                    )}
                                                    {viewMode === 'admin' && (
                                                        <button className="action-btn delete-btn" onClick={() => handleDelete(inv.invoiceId)} title="Delete">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Payment Modal ── */}
            {showPaymentModal && payingInvoice && (
                <div className="payment-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !processingPayment) { setShowPaymentModal(false); } }}>
                    <div className="payment-modal">
                        {paymentSuccess ? (
                            <div className="payment-success-screen">
                                <div className="success-circle">
                                    <CheckCircle size={52} />
                                </div>
                                <h2>Payment Successful!</h2>
                                <p>Your payment of <strong>${(payingInvoice.total ?? 0).toFixed(2)}</strong> has been processed.</p>
                                <p className="success-ref">Invoice: {payingInvoice.invoiceId}</p>
                            </div>
                        ) : (
                            <>
                                <div className="payment-modal-header">
                                    <div className="payment-modal-icon"><CreditCard size={22} /></div>
                                    <div>
                                        <h2>Complete Payment</h2>
                                        <p>Invoice {payingInvoice.invoiceId} &mdash; {payingInvoice.taskType}</p>
                                    </div>
                                    <button className="payment-modal-close" onClick={() => setShowPaymentModal(false)} disabled={processingPayment}>&times;</button>
                                </div>

                                {/* Amount banner */}
                                <div className="payment-amount-banner">
                                    <span>Total Due</span>
                                    <span className="payment-amount-value">${(payingInvoice.total ?? 0).toFixed(2)}</span>
                                </div>

                                {/* Card visual */}
                                <div className={`card-visual card-${detectCardType(cardDetails.cardNumber)}`}>
                                    <div className="card-visual-top">
                                        <div className="card-chip" />
                                        <div className="card-network-logo">
                                            {detectCardType(cardDetails.cardNumber) === 'visa' && <span>VISA</span>}
                                            {detectCardType(cardDetails.cardNumber) === 'mastercard' && <span>MC</span>}
                                            {detectCardType(cardDetails.cardNumber) === 'amex' && <span>AMEX</span>}
                                            {detectCardType(cardDetails.cardNumber) === 'discover' && <span>DISC</span>}
                                            {detectCardType(cardDetails.cardNumber) === 'unknown' && <CreditCard size={24} opacity={0.6} />}
                                        </div>
                                    </div>
                                    <div className="card-number-display">
                                        {(cardDetails.cardNumber || '•••• •••• •••• ••••').padEnd(19, '•').replace(/(.{4})/g, '$1 ').trim()}
                                    </div>
                                    <div className="card-visual-bottom">
                                        <div>
                                            <div className="card-label-small">Cardholder</div>
                                            <div className="card-holder-display">{cardDetails.cardholderName || 'YOUR NAME'}</div>
                                        </div>
                                        <div>
                                            <div className="card-label-small">Expires</div>
                                            <div className="card-expiry-display">{cardDetails.expiry || 'MM/YY'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form fields */}
                                <div className="payment-form">
                                    <div className="payment-field">
                                        <label>Cardholder Name</label>
                                        <input
                                            type="text"
                                            placeholder="Name on card"
                                            maxLength={60}
                                            value={cardDetails.cardholderName}
                                            onChange={e => setCardDetails(d => ({ ...d, cardholderName: e.target.value }))}
                                            disabled={processingPayment}
                                        />
                                    </div>
                                    <div className="payment-field">
                                        <label>Card Number</label>
                                        <div className="payment-input-icon-wrap">
                                            <input
                                                type="text"
                                                placeholder="1234 5678 9012 3456"
                                                value={cardDetails.cardNumber}
                                                onChange={e => setCardDetails(d => ({ ...d, cardNumber: formatCardNumber(e.target.value) }))}
                                                maxLength={19}
                                                disabled={processingPayment}
                                            />
                                            <CreditCard size={16} className="payment-input-icon" />
                                        </div>
                                    </div>
                                    <div className="payment-field-row">
                                        <div className="payment-field">
                                            <label>Expiry Date</label>
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={cardDetails.expiry}
                                                maxLength={5}
                                                onChange={e => setCardDetails(d => ({ ...d, expiry: formatExpiry(e.target.value) }))}
                                                disabled={processingPayment}
                                            />
                                        </div>
                                        <div className="payment-field">
                                            <label>CVV</label>
                                            <input
                                                type="password"
                                                placeholder="•••"
                                                value={cardDetails.cvv}
                                                maxLength={4}
                                                onChange={e => setCardDetails(d => ({ ...d, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                                disabled={processingPayment}
                                            />
                                        </div>
                                    </div>

                                    <div className="payment-secure-note">
                                        <CheckCircle size={13} /> Payments are encrypted and secure
                                    </div>

                                    <button
                                        className="btn-pay-submit"
                                        onClick={handleCompletePayment}
                                        disabled={processingPayment}
                                    >
                                        {processingPayment
                                            ? <><Loader size={18} className="spin" /> Processing Payment…</>
                                            : <><CreditCard size={18} /> Pay ${(payingInvoice.total ?? 0).toFixed(2)}</>}
                                    </button>
                                    <button className="btn-cancel-payment" onClick={() => setShowPaymentModal(false)} disabled={processingPayment}>
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Billing;
