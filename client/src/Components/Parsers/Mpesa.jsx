import React, { useState, useMemo } from 'react';
import { Upload, FileText, Search, AlertCircle, Loader2, Wallet } from 'lucide-react';
import '../styles/Mpesa.css';

const Mpesa = () => {
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [transactions, setTransactions] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);
        setSummary(null);
        const formData = new FormData();
        formData.append('statement', file);
        formData.append('password', password);

        try {
            const response = await fetch('http://localhost:5000/api/parse/mpesa', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                setTransactions(result.transactions);
                setSummary(result.summary || null);
            } else {
                setError(result.error || 'Failed to parse statement. Please check the password.');
            }
        } catch (err) {
            setError('Cannot connect to the backend server. Ensure it is running on port 5000.');
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx =>
            tx.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.receiptNo.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const walletBalance = summary?.currentBalance || (filteredData[0]?.balance || '0.00');

    return (
        <div className="mpesa-wrapper">
            {/* Header Section */}
            <header className="mpesa-header">
                <div className="mpesa-icon-box"><FileText size={24} /></div>
                <h1>M-Pesa Statement <span>Pro</span></h1>
            </header>

            {/* Upload Section */}
            <div className="mpesa-card">
                <form onSubmit={handleUpload} className="mpesa-upload-grid">
                    <div className="mpesa-input-group">
                        <label>M-Pesa Statement (PDF)</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="mpesa-file-input"
                        />
                    </div>
                    <div className="mpesa-input-group">
                        <label>PDF Password</label>
                        <input
                            type="password"
                            placeholder="Enter ID/Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mpesa-text-input"
                        />
                    </div>
                    <button type="submit" disabled={loading || !file} className="mpesa-parse-btn">
                        {loading ? <Loader2 className="mpesa-spin" size={20} /> : <Upload size={20} />}
                        {loading ? 'Processing...' : 'Analyze PDF'}
                    </button>
                </form>
                {error && <div className="mpesa-error-msg"><AlertCircle size={18} /> {error}</div>}
            </div>

            {/* Results Section */}
            {transactions && (
                <div className="mpesa-table-container">
                    {summary && (
                        <div className="mpesa-summary-panel">
                            <div className="mpesa-summary-main">
                                <div className="mpesa-summary-pill">
                                    <Wallet size={16} />
                                    M-Pesa Wallet Worth
                                </div>
                                <div className="mpesa-summary-value">Ksh {walletBalance}</div>
                                <div className="mpesa-summary-meta">
                                    ook
                                    {summary.customerName ? <span>{summary.customerName}</span> : null}
                                    {summary.statementPeriod ? <span>{summary.statementPeriod}</span> : null}
                                    {summary.requestDate ? <span>{summary.requestDate}</span> : null}
                                </div>
                            </div>

                            <div className="mpesa-summary-breakdown">
                                <div className="mpesa-summary-table-wrap">
                                    <table className="mpesa-summary-table">
                                        <thead>
                                            <tr>
                                                <th>TRANSACTION TYPE</th>
                                                <th className="mpesa-text-right">PAID IN</th>
                                                <th className="mpesa-text-right">PAID OUT</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {summary.paidInByType?.map((item) => (
                                                <tr key={`${item.type}-${item.paidIn}-${item.paidOut}`} className={item.type.toUpperCase() === 'TOTAL' ? 'is-total' : ''}>
                                                    <td>{item.type}</td>
                                                    <td className="mpesa-text-right">
                                                        {item.paidIn !== '0.00' ? item.paidIn : '0.00'}
                                                    </td>
                                                    <td className="mpesa-text-right">
                                                        {item.paidOut !== '0.00' ? item.paidOut : '0.00'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mpesa-table-header">
                        <div className="mpesa-title-area">
                            <h3>Detailed Transactions</h3>
                            <p className="mpesa-count-subtext">Found {filteredData.length} records</p>
                        </div>

                        <div className="mpesa-search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search details or receipt..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mpesa-scroll-area">
                        <table className="mpesa-statement-table">
                            <thead>
                                <tr>
                                    <th>Receipt No</th>
                                    <th>Completion Time</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                    <th className="mpesa-text-right">Paid In</th>
                                    <th className="mpesa-text-right">Withdrawn</th>
                                    <th className="mpesa-text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((tx, idx) => (
                                    <tr key={idx} className="mpesa-row-hover">
                                        <td data-label="Receipt" className="mpesa-receipt-cell">{tx.receiptNo}</td>
                                        <td data-label="Time" className="mpesa-time-cell">{tx.completionTime}</td>
                                        <td data-label="Details" className="mpesa-details-cell">
                                            <div className="mpesa-tx-desc">{tx.details}</div>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`mpesa-status-badge ${tx.status.toLowerCase() === 'completed' ? 'completed' : ''}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td data-label="Paid In" className="mpesa-text-right mpesa-amt-in">
                                            {tx.paidIn !== "0.00" ? `+${tx.paidIn}` : '—'}
                                        </td>
                                        <td data-label="Withdrawn" className="mpesa-text-right mpesa-amt-out">
                                            {tx.withdrawn !== "0.00" ? `-${tx.withdrawn}` : '—'}
                                        </td>
                                        <td data-label="Balance" className="mpesa-text-right mpesa-balance-cell">{tx.balance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mpesa;
