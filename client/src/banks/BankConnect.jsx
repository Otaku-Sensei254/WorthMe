import React, { useState, useMemo, useEffect } from 'react'; // Added useEffect
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Link2, ShieldCheck, FileText, Info, Loader2, AlertCircle, Search } from 'lucide-react';
import '../Components/styles/BankConnect.css';

const bankDetails = {
    im: { name: 'I&M Bank', color: '#00339f' },
    kcb: { name: 'KCB Bank', color: '#7cc142' },
    equity: { name: 'Equity Bank', color: '#ad500f' },
    coop: { name: 'Co-op Bank', color: '#1f4931' },
    airtel: { name: 'Airtel Money', color: '#ff0000' },
    mpesa: { name: 'M-Pesa', color: '#2db742' }
};

const BankConnect = () => {
    const { bankId } = useParams();
    const navigate = useNavigate();
    
    // --- 1. STATE DEFINITIONS ---
    const [method, setMethod] = useState('sync'); // Set default to 'sync'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Sync Method Inputs
    const [accountNumber, setAccountNumber] = useState('');
    const [onlineId, setOnlineId] = useState('');
    
    // PDF Method Inputs
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    const [transactions, setTransactions] = useState(null);

    const bank = bankDetails[bankId];

    // --- 2. RESET LOGIC ---
    // This runs every time the user navigates to a different bank
    useEffect(() => {
        setMethod('sync');
        setAccountNumber('');
        setOnlineId('');
        setFile(null);
        setPassword('');
        setTransactions(null);
        setError(null);
        setSearchTerm('');
    }, [bankId]); // Dependency on bankId

    const filteredData = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx =>
            Object.values(tx).some(val => 
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
    }, [transactions, searchTerm]);

    if (!bank) return <div className="error-state">Provider not found</div>;

    // --- 3. EVENT HANDLERS ---
    const handlePdfUpload = async (e) => {
        e.preventDefault();
        if (!file) return;

        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append('statement', file);
        formData.append('password', password);
        formData.append('bank_type', bankId);

        try {
            const response = await fetch('http://localhost:5000/upload', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                setTransactions(result.transactions);
            } else {
                setError(result.error || `Failed to parse ${bank.name} statement.`);
            }
        } catch (err) {
            setError('Cannot connect to the backend server.');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncConnect = (e) => {
        e.preventDefault();
        setLoading(true);
        // This is where you'd typically call an API for Direct Sync
        setTimeout(() => {
            setLoading(false);
            alert("Syncing is currently under maintenance. Please use PDF Upload.");
        }, 2000);
    };

    return (
        <div className="connect-page-wrapper">
            <button className="back-link" onClick={() => navigate('/banks')}>
                <ArrowLeft size={18} /> Back to Hub
            </button>

            <div className="connect-container">
                <header className="connect-header" style={{ borderTop: `6px solid ${bank.color}` }}>
                    <div className="bank-avatar" style={{ backgroundColor: bank.color }}>
                        {bank.name[0]}
                    </div>
                    <h1>Connect {bank.name}</h1>
                    <p>Select a method to link your transaction data</p>
                </header>

                <div className="method-tabs">
                    <button className={method === 'sync' ? 'active' : ''} onClick={() => setMethod('sync')}>
                        <Link2 size={18} /> Direct Sync
                    </button>
                    <button className={method === 'pdf' ? 'active' : ''} onClick={() => setMethod('pdf')}>
                        <FileText size={18} /> PDF Upload
                    </button>
                </div>

                <div className="connect-content">
                    {method === 'sync' ? (
                        <form onSubmit={handleSyncConnect} className="method-form">
                            <div className="form-group">
                                <label>Account Number</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. 0123456789" 
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Mobile Number / Online ID</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter ID" 
                                    value={onlineId}
                                    onChange={(e) => setOnlineId(e.target.value)}
                                    required 
                                />
                            </div>
                            <button className="connect-btn" style={{ backgroundColor: bank.color }} disabled={loading}>
                                {loading ? <Loader2 className="spin" size={20} /> : <ShieldCheck size={18} />}
                                {loading ? 'Establishing Connection...' : 'Connect Securely'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handlePdfUpload} className="method-form">
                            <div className="upload-box">
                                <Upload size={32} style={{ color: bank.color }} />
                                <h4>Upload {bank.name} Statement</h4>
                                <p>{file ? file.name : 'Drag and drop your PDF here'}</p>
                                <input 
                                    type="file" 
                                    accept=".pdf" 
                                    className="file-overlay" 
                                    onChange={(e) => setFile(e.target.files[0])}
                                />
                            </div>
                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Statement Password (Optional)</label>
                                <input 
                                    type="password" 
                                    placeholder="Required for encrypted PDFs" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <button className="connect-btn" style={{ backgroundColor: bank.color }} disabled={loading || !file}>
                                {loading ? <Loader2 className="spin" size={20} /> : <FileText size={18} />}
                                {loading ? 'Processing...' : 'Process Statement'}
                            </button>
                        </form>
                    )}
                    {error && <div className="error-msg" style={{color: 'red', marginTop: '10px', display: 'flex', gap: '5px', alignItems: 'center'}}><AlertCircle size={16}/> {error}</div>}
                </div>

                <footer className="connect-footer">
                    <Info size={16} />
                    <p>We only request read-only access. We cannot move funds from your account.</p>
                </footer>
            </div>

            {/* --- RESULTS TABLE --- */}
            {transactions && transactions.length > 0 && (
                <div className="mpesa-table-container" style={{ marginTop: '30px' }}>
                    <div className="mpesa-table-header">
                        <div className="mpesa-title-area">
                            <h3>Parsed Transactions</h3>
                            <p className="mpesa-count-subtext">Found {filteredData.length} records</p>
                        </div>
                        <div className="mpesa-search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search results..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mpesa-scroll-area">
                        <table className="mpesa-statement-table">
                            <thead>
                                <tr>
                                    {Object.keys(transactions[0]).map((key) => (
                                        <th key={key}>{key.toUpperCase().replace('_', ' ')}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((tx, idx) => (
                                    <tr key={idx} className="mpesa-row-hover">
                                        {Object.values(tx).map((val, i) => (
                                            <td key={i}>{val || '—'}</td>
                                        ))}
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

export default BankConnect;