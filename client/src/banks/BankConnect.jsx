import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Search, AlertCircle, Loader2, ShieldCheck, Link2, Table, Database, CheckCircle2 } from 'lucide-react';
import '../Components/styles/BankConnect.css';

// Minimal bank details, no more hardcoded columns
const bankDetails = {
    im: { name: 'I&M Bank', color: '#00339f' },
    mpesa: { name: 'M-Pesa', color: '#2db742' },
    kcb: { name: 'KCB Bank', color: '#7cc142' },
    equity: { name: 'Equity Bank', color: '#ad500f' },
    airtel: { name: 'Airtel Money', color: 'red' },
    coop: { name: 'Cooperative Bank', color: '#052b0d' }
};

// Helper to generate a human-friendly label from a camelCase key
const formatLabel = (key) => {
    const result = key.replace(/([A-Z])/g, ' $1');
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const BankConnect = () => {
    const { bankId } = useParams();
    const navigate = useNavigate();
    const bank = bankDetails[bankId] || bankDetails.im;

    const [method, setMethod] = useState('pdf'); // Default to PDF
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState(null);
    const [columns, setColumns] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // Input States
    const [accNo, setAccNo] = useState('');
    const [idNo, setIdNo] = useState('');
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');

    // Effect to generate columns when transactions are loaded
    useEffect(() => {
        if (transactions && transactions.length > 0) {
            const firstTx = transactions[0];
            const generatedColumns = Object.keys(firstTx).map(key => ({
                key,
                label: formatLabel(key)
            }));
            setColumns(generatedColumns);
        }
    }, [transactions]);

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setTransactions(null); // Reset on new connection
        setColumns([]);      // Reset on new connection

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
                if (result.success && result.transactions.length > 0) {
                    setTransactions(result.transactions);
                } else if (result.success) {
                    setError("No transactions found in the PDF.");
                }
                else {
                    setError(result.message || "Parsing failed.");
                }
            } catch (err) {
                setError("Could not connect to parsing server. Is it running?");
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
                                        <span>{file ? file.name : 'Click to upload PDF'}</span>
                                        <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                                    </div>
                                    <div className="bc-field">
                                        <label>PDF Password (if any)</label>
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Optional" />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="bc-submit-btn" style={{ backgroundColor: bank.color }} disabled={loading}>
                                {loading ? <Loader2 className="bc-spin" size={20} /> : <ShieldCheck size={20} />}
                                {loading ? 'Processing...' : 'Connect Securely'}
                            </button>
                            {error && <div className="bc-err"><AlertCircle size={14} /> {error}</div>}
                        </form>
                        <div className="bc-footer-note"><CheckCircle2 size={12}/> Your data is processed locally and is never stored.</div>
                    </div>
                </aside>

                {/* RIGHT: RESULTS TABLE */}
                <main className="bc-main">
                    {transactions ? (
                        <div className="bc-results-card">
                            <div className="bc-results-header">
                                <div className="bc-info">
                                    <h3>Transaction History</h3>
                                    <p>Found {filteredData.length} of {transactions.length} records</p>
                                </div>
                                <div className="bc-search">
                                    <Search size={18} />
                                    <input placeholder="Filter results..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <div className="bc-table-container">
                                <table className="bc-table">
                                    <thead>
                                        <tr>
                                            {columns.map(col => <th key={col.key}>{col.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredData.map((tx, idx) => (
                                            <tr key={idx}>
                                                {columns.map(col => {
                                                    const val = tx[col.key];
                                                    // Dynamic highlighting for common money columns
                                                    const isPos = (col.key.toLowerCase().includes('paidin') || col.key.toLowerCase().includes('deposits') || col.key.toLowerCase().includes('credit')) && parseFloat(val) > 0;
                                                    const isNeg = (col.key.toLowerCase().includes('withdrawn') || col.key.toLowerCase().includes('debit')) && parseFloat(val) > 0;
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
                            <h3>Awaiting Data</h3>
                            <p>Connect your {bank.name} account by uploading a PDF statement to view transactions.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BankConnect;
