import React, { useState, useMemo } from 'react';
import { Upload, FileText, Search, AlertCircle, Loader2, Wallet, ArrowUpRight, ArrowDownRight, BadgeInfo } from 'lucide-react';
import '../styles/Airtel.css';

const Airtel = () => {
    const [file, setFile] = useState(null);
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

        try {
            const response = await fetch('http://localhost:5000/api/parse/airtel', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                setTransactions(result.transactions);
                setSummary(result.summary || null);
            } else {
                setError(result.error || 'Failed to parse Airtel statement.');
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
            tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [transactions, searchTerm]);

    const worthValue = summary?.closingBalance || '0.00';

    return (
        <div className="airtel-wrapper">
            {/* Header Section */}
            <header className="airtel-header">
                <div className="airtel-icon-box"><FileText size={24} /></div>
                <h1>Airtel Money <span>Statement</span></h1>
            </header>

            {/* Upload Section */}
            <div className="airtel-card">
                <form onSubmit={handleUpload} className="airtel-upload-grid">
                    <div className="airtel-input-group">
                        <label>Airtel Money Statement (PDF)</label>
                        <input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="airtel-file-input"
                        />
                    </div>
                    <button type="submit" disabled={loading || !file} className="airtel-parse-btn">
                        {loading ? <Loader2 className="airtel-spin" size={20} /> : <Upload size={20} />}
                        {loading ? 'Processing...' : 'Analyze PDF'}
                    </button>
                </form>
                {error && <div className="airtel-error-msg"><AlertCircle size={18} /> {error}</div>}
            </div>

            {/* Results Section */}
            {transactions && (
                <div className="airtel-table-container">
                    {summary && (
                        <div className="airtel-summary-panel">
                            <div className="airtel-summary-main">
                                <div className="airtel-summary-pill">
                                    <Wallet size={16} />
                                    Airtel Wallet Worth
                                </div>
                                <div className="airtel-summary-value">Ksh {worthValue}</div>
                                <div className="airtel-summary-meta">
                                    {summary.customerName ? <span>{summary.customerName}</span> : null}
                                    {summary.statementPeriod ? <span>{summary.statementPeriod}</span> : null}
                                </div>
                            </div>

                            <div className="airtel-summary-grid">
                                <div className="airtel-summary-card">
                                    <ArrowUpRight size={16} />
                                    <span>Total Credit</span>
                                    <strong>Ksh {summary.totalCredit}</strong>
                                </div>
                                <div className="airtel-summary-card">
                                    <ArrowDownRight size={16} />
                                    <span>Total Debit</span>
                                    <strong>Ksh {summary.totalDebit}</strong>
                                </div>
                                <div className="airtel-summary-card">
                                    <BadgeInfo size={16} />
                                    <span>Closing Balance</span>
                                    <strong>Ksh {summary.closingBalance}</strong>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="airtel-table-header">
                        <div className="airtel-title-area">
                            <h3>Detailed Transactions</h3>
                            <p className="airtel-count-subtext">Found {filteredData.length} records</p>
                        </div>

                        <div className="airtel-search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search description or transaction ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="airtel-scroll-area">
                        <table className="airtel-statement-table">
                            <thead>
                                <tr>
                                    <th>Transaction ID</th>
                                    <th>Transaction Date</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th className="airtel-text-right">Credit</th>
                                    <th className="airtel-text-right">Debit</th>
                                    <th className="airtel-text-right">Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((tx, idx) => (
                                    <tr key={idx} className="airtel-row-hover">
                                        <td data-label="Transaction ID" className="airtel-tx-id-cell">{tx.transactionId}</td>
                                        <td data-label="Date" className="airtel-date-cell">{tx.transactionDate}</td>
                                        <td data-label="Description" className="airtel-details-cell">
                                            <div className="airtel-tx-desc">{tx.description}</div>
                                        </td>
                                        <td data-label="Status">
                                            <span className={`airtel-status-badge ${tx.status.toLowerCase().includes('successful') ? 'successful' : ''}`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                        <td data-label="Credit" className="airtel-text-right airtel-amt-in">
                                            {tx.credit !== "0.00" ? `+Ksh ${tx.credit}` : '—'}
                                        </td>
                                        <td data-label="Debit" className="airtel-text-right airtel-amt-out">
                                            {tx.debit !== "0.00" ? `-Ksh ${tx.debit}` : '—'}
                                        </td>
                                        <td data-label="Balance" className="airtel-text-right airtel-balance-cell">Ksh {tx.balance}</td>
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

export default Airtel;
