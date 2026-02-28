import React, { useState } from 'react';
import { CreditCard, FileText, CheckCircle, Clock, Plus, DollarSign, Activity } from 'lucide-react';
import './Billing.css';

// Base fees mapping for calculation
const feeStructure = {
    'General Waste': { wasteFee: 20, laborFee: 15, vehicleFee: 25 },
    'Bulk Waste': { wasteFee: 50, laborFee: 30, vehicleFee: 40 },
    'Hazardous Waste': { wasteFee: 100, laborFee: 50, vehicleFee: 60 },
    'Recyclables': { wasteFee: 10, laborFee: 10, vehicleFee: 15 }
};

const initialInvoices = [
    { id: 'INV-1021', date: '2026-02-28', residentId: 'R-001', residentName: 'John Doe', taskType: 'Bulk Waste', ...feeStructure['Bulk Waste'], total: 120, status: 'Unpaid' },
    { id: 'INV-1020', date: '2026-02-25', residentId: 'R-002', residentName: 'Jane Smith', taskType: 'Hazardous Waste', ...feeStructure['Hazardous Waste'], total: 210, status: 'Paid' },
    { id: 'INV-1019', date: '2026-02-20', residentId: 'R-001', residentName: 'John Doe', taskType: 'General Waste', ...feeStructure['General Waste'], total: 60, status: 'Paid' },
    { id: 'INV-1018', date: '2026-02-18', residentId: 'R-003', residentName: 'Alice Johnson', taskType: 'Recyclables', ...feeStructure['Recyclables'], total: 35, status: 'Unpaid' }
];

const mockResidents = [
    { id: 'R-001', name: 'John Doe' },
    { id: 'R-002', name: 'Jane Smith' },
    { id: 'R-003', name: 'Alice Johnson' }
];

const Billing = () => {
    const [viewMode, setViewMode] = useState('resident'); // 'resident' or 'admin'
    const [invoices, setInvoices] = useState(initialInvoices);
    const [showGenerateForm, setShowGenerateForm] = useState(false);

    // Generate Invoice Form State
    const [selectedResident, setSelectedResident] = useState(mockResidents[0].id);
    const [selectedTaskType, setSelectedTaskType] = useState('General Waste');

    // Currently logged-in resident mock (for resident view)
    const currentResidentId = 'R-001';

    const handlePayNow = (id) => {
        setInvoices(invoices.map(inv =>
            inv.id === id ? { ...inv, status: 'Paid' } : inv
        ));
    };

    const handleGenerateInvoice = () => {
        const fees = feeStructure[selectedTaskType];
        const resident = mockResidents.find(r => r.id === selectedResident);
        const newInvoice = {
            id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
            date: new Date().toISOString().split('T')[0],
            residentId: resident.id,
            residentName: resident.name,
            taskType: selectedTaskType,
            ...fees,
            total: fees.wasteFee + fees.laborFee + fees.vehicleFee,
            status: 'Unpaid'
        };
        setInvoices([newInvoice, ...invoices]);
        setShowGenerateForm(false);
    };

    const displayedInvoices = viewMode === 'resident'
        ? invoices.filter(inv => inv.residentId === currentResidentId)
        : invoices;

    // Admin Stats Calculation
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + i.total, 0);
    const totalInvoices = invoices.length;

    return (
        <div className="billing-container">
            <div className="billing-header">
                <div className="billing-title">
                    <h1>Services Payment & Billings</h1>
                    <p>Manage your waste collection invoices and payments</p>
                </div>

                {/* View Toggle for Demo Purposes */}
                <div className="view-toggle">
                    <button
                        className={`toggle-btn ${viewMode === 'resident' ? 'active' : ''}`}
                        onClick={() => setViewMode('resident')}
                    >
                        Resident View
                    </button>
                    <button
                        className={`toggle-btn ${viewMode === 'admin' ? 'active' : ''}`}
                        onClick={() => setViewMode('admin')}
                    >
                        Admin View
                    </button>
                </div>
            </div>

            {viewMode === 'admin' && (
                <div className="billing-stats">
                    <div className="stat-card">
                        <div className="stat-icon revenue">
                            <DollarSign />
                        </div>
                        <div className="stat-info">
                            <h3>Total Revenue</h3>
                            <p>${totalRevenue.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon pending">
                            <Clock />
                        </div>
                        <div className="stat-info">
                            <h3>Pending Payments</h3>
                            <p>${pendingAmount.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon total">
                            <Activity />
                        </div>
                        <div className="stat-info">
                            <h3>Total Invoices</h3>
                            <p>{totalInvoices}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="invoices-section">
                <div className="billing-section-header">
                    <h2>{viewMode === 'resident' ? 'My Invoices' : 'All Invoices'}</h2>
                    {viewMode === 'admin' && (
                        <button className="btn-primary" onClick={() => setShowGenerateForm(!showGenerateForm)}>
                            <Plus size={18} /> {showGenerateForm ? 'Cancel' : 'Generate Invoice'}
                        </button>
                    )}
                </div>

                {viewMode === 'admin' && showGenerateForm && (
                    <div className="generate-invoice-card">
                        <h3>Simulate Task Completion (Auto-Invoice)</h3>
                        <p style={{ color: 'var(--text-gray)', marginBottom: '20px', fontSize: '0.9rem' }}>
                            In a real scenario, this happens automatically when a task is marked as completed by a worker.
                        </p>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>Resident</label>
                                <select
                                    value={selectedResident}
                                    onChange={(e) => setSelectedResident(e.target.value)}
                                >
                                    {mockResidents.map(r => (
                                        <option key={r.id} value={r.id}>{r.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Task / Waste Type</label>
                                <select
                                    value={selectedTaskType}
                                    onChange={(e) => setSelectedTaskType(e.target.value)}
                                >
                                    {Object.keys(feeStructure).map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="fee-breakdown">
                            <div className="fee-row">
                                <span>Waste Type Fee</span>
                                <span>${feeStructure[selectedTaskType].wasteFee.toFixed(2)}</span>
                            </div>
                            <div className="fee-row">
                                <span>Labor Fee</span>
                                <span>${feeStructure[selectedTaskType].laborFee.toFixed(2)}</span>
                            </div>
                            <div className="fee-row">
                                <span>Vehicle Fee</span>
                                <span>${feeStructure[selectedTaskType].vehicleFee.toFixed(2)}</span>
                            </div>
                            <div className="fee-row">
                                <span>Total Simulated Charge</span>
                                <span>${(feeStructure[selectedTaskType].wasteFee + feeStructure[selectedTaskType].laborFee + feeStructure[selectedTaskType].vehicleFee).toFixed(2)}</span>
                            </div>
                        </div>

                        <button className="btn-primary" onClick={handleGenerateInvoice}>
                            <FileText size={18} /> Generate & Send Invoice
                        </button>
                    </div>
                )}

                <div className="table-wrapper">
                    <table className="invoices-table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Date</th>
                                {viewMode === 'admin' && <th>Resident</th>}
                                <th>Task Type</th>
                                <th>Breakdown (Waste/Labor/Vehicle)</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayedInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={viewMode === 'admin' ? 8 : 7} style={{ textAlign: 'center', padding: '40px' }}>
                                        No invoices found.
                                    </td>
                                </tr>
                            ) : (
                                displayedInvoices.map(invoice => (
                                    <tr key={invoice.id}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>{invoice.id}</td>
                                        <td>{invoice.date}</td>
                                        {viewMode === 'admin' && <td>{invoice.residentName}</td>}
                                        <td>{invoice.taskType}</td>
                                        <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                            ${invoice.wasteFee} / ${invoice.laborFee} / ${invoice.vehicleFee}
                                        </td>
                                        <td style={{ fontWeight: 700 }}>${invoice.total.toFixed(2)}</td>
                                        <td>
                                            <span className={`status-badge ${invoice.status.toLowerCase()}`}>
                                                {invoice.status}
                                            </span>
                                        </td>
                                        <td>
                                            {invoice.status === 'Unpaid' ? (
                                                <button
                                                    className="action-btn"
                                                    onClick={() => handlePayNow(invoice.id)}
                                                    disabled={viewMode === 'admin'}
                                                    title={viewMode === 'admin' ? "Only residents can pay" : "Pay securely"}
                                                >
                                                    <CreditCard size={16} style={{ marginBottom: '-3px', marginRight: '4px' }} />
                                                    Pay Now
                                                </button>
                                            ) : (
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <CheckCircle size={18} /> Paid
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Billing;
