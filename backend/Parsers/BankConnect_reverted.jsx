import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Search, AlertCircle, Loader2, ShieldCheck, Link2, Table, Database, CheckCircle2 } from 'lucide-react';
import '../Components/styles/BankConnect.css';

const bankDetails = {
    im: { 
        name: 'I&M Bank', color: '#00339f',
        columns: [
            { key: 'date', label: 'Tran Date' },
            { key: 'ref', label: 'Ref No' },
            { key: 'details', label: 'Transaction Narrative' },
            { key: 'withdrawn', label: 'Withdrawals' },
            { key: 'paidIn', label: 'Deposits' },
            { key: 'balance', label: 'Balance' }
        ]
    },
    mpesa: { 
        name: 'M-Pesa', color: '#2db742',
        columns: [
            { key: 'ref', label: 'Receipt No' },
            { key: 'date', label: 'Completion Time' },
            { key: 'details', label: 'Details' },
            { key: 'withdrawn', label: 'Withdrawn' },
            { key: 'paidIn', label: 'Paid In' },
            { key: 'balance', label: 'Balance' }
        ]
    },
    kcb: { name: 'KCB Bank', color: '#7cc142', columns: [ { key: 'date', label: 'Date' }, { key: 'ref', label: 'Ref' }, { key: 'details', label: 'Description' }, { key: 'withdrawn', label: 'Debit' }, { key: 'paidIn', label: 'Credit' }, { key: 'balance', label: 'Balance' } ] },
    equity: { name: 'Equity Bank', color: '#ad500f', columns: [ { key: 'date', label: 'Date' }, { key: 'ref', label: 'Ref' }, { key: 'details', label: 'Description' }, { key: 'withdrawn', label: 'Money Out' }, { key: 'paidIn', label: 'Money In' }, { key: 'balance', label: 'Balance' } ] }
};

const BankConnect = () => {
    const { bankId } = useParams();
    const navigate = useNavigate();
    const bank = bankDetails[bankId] || bankDetails.im;

    const [method, setMethod] = useState('direct');
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Input States
    const [accNo, setAccNo] = useState('');
    const [idNo, setIdNo] = useState('');
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (method === 'direct') {
            // --- SIMULATED DUMMY CONNECTION ---
            setTimeout(() => {
                const mockTransactions = [
                    { date: '2024-06-01', ref: 'FT24152X9', details: 'Salary Remittance', withdrawn: '0.00', paidIn: '185,000.00', balance: '185,000.00' },
                    { date: '2024-06-02', ref: 'FT24153P1', details: 'KPLC Postpaid Bill', withdrawn: '4,200.00', paidIn: '0.00', balance: '180,800.00' },
                    { date: '2024-06-05', ref: 'FT24155L0', details: 'Transfer to M-Pesa', withdrawn: '10,000.00', paidIn: '0.00', balance: '170,800.00' }
                ];
                setTransactions(mockTransactions);
                setLoading(false);
            }, 2000);
        } else {
            // --- REAL PDF PARSER CONNECTION ---
            if (!file) { setError("Please select a PDF file."); setLoading(false); return; }
            const formData = new FormData();
            formData.append('statement', file);
            formData.append('password', password);

            try {
                const response = await fetch(`http://localhost:5000/api/parse/${bankId}`, {
                    method: 'POST',
                    body: formData,
                });
                const result = await response.json();
                if (result.success) setTransactions(result.transactions);
                else setError(result.error || "Parsing failed.");
            } catch (err) {
                setError("Could not connect to parsing server.");
            } finally {
                setLoading(false);
            }
        }
    };

    const filteredData = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx =>
            Object.values(tx).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [transactions, searchTerm]);

    return (
        <div className="bc-page">
            <nav className="bc-nav">
                <button onClick={() => navigate('/banks')} className="bc-back-btn">
                    <ArrowLeft size={18} /> Back
                </button>
            </nav>

            <div className="bc-layout">
                {/* LEFT: FORM SIDEBAR */}
                <aside className="bc-sidebar">
                    <div className="bc-sticky-card">
                        <header className="bc-card-header" style={{ borderTop: `6px solid ${bank.color}` }}>
                            <div className="bc-bank-icon" style={{ backgroundColor: bank.color }}>{bank.name[0]}</div>
                            <h2>{bank.name}</h2>
                            <p>Connect your account securely</p>
                        </header>

                        <div className="bc-tabs">
                            <button className={method === 'direct' ? 'active' : ''} onClick={() => setMethod('direct')}>
                                <Link2 size={16} /> Direct
                            </button>
                            <button className={method === 'pdf' ? 'active' : ''} onClick={() => setMethod('pdf')}>
                                <FileText size={16} /> PDF
                            </button>
                        </div>

                        <form onSubmit={handleConnect} className="bc-form">
                            {method === 'direct' ? (
                                <div className="bc-inputs">
                                    <div className="bc-field">
                                        <label>Account Number</label>
                                        <input type="text" value={accNo} onChange={e => setAccNo(e.target.value)} placeholder="0100XXXXXX" required />
                                    </div>
                                    <div className="bc-field">
                                        <label>ID / Passport Number</label>
                                        <input type="text" value={idNo} onChange={e => setIdNo(e.target.value)} placeholder="Enter ID" required />
                                    </div>
                                </div>
                            ) : (
                                <div className="bc-inputs">
                                    <div className="bc-upload-zone">
                                        <Upload size={24} style={{ color: bank.color }} />
                                        <span>{file ? file.name : 'Upload PDF'}</span>
                                        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                                    </div>
                                    <div className="bc-field">
                                        <label>Password (if any)</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••" />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="bc-submit-btn" style={{ backgroundColor: bank.color }} disabled={loading}>
                                {loading ? <Loader2 className="bc-spin" size={20} /> : <ShieldCheck size={20} />}
                                {loading ? 'Processing...' : 'Secure Connect'}
                            </button>
                            {error && <div className="bc-err"><AlertCircle size={14} /> {error}</div>}
                        </form>
                        <div className="bc-footer-note"><CheckCircle2 size={12}/> Secure 256-bit encryption</div>
                    </div>
                </aside>

                {/* RIGHT: RESULTS TABLE */}
                <main className="bc-main">
                    {transactions ? (
                        <div className="bc-results-card">
                            <div className="bc-results-header">
                                <div className="bc-info">
                                    <h3>Transaction History</h3>
                                    <p>{filteredData.length} records found</p>
                                </div>
                                <div className="bc-search">
                                    <Search size={18} />
                                    <input placeholder="Filter..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="bc-table-container">
                                <table className="bc-table">
                                    <thead>
                                        <tr>
                                            {bank.columns.map(col => <th key={col.key}>{col.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((tx, idx) => (
                                            <tr key={idx}>
                                                {bank.columns.map(col => {
                                                    const val = tx[col.key];
                                                    const isPos = col.key === 'paidIn' && val !== '0.00';
                                                    const isNeg = col.key === 'withdrawn' && val !== '0.00';
                                                    return (
                                                        <td key={col.key} className={isPos ? 'amt-pos' : isNeg ? 'amt-neg' : ''}>
                                                            {val || '—'}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bc-empty">
                            <Database size={64} />
                            <h3>No Data Loaded</h3>
                            <p>Connect your {bank.name} account to view transactions.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BankConnect;
