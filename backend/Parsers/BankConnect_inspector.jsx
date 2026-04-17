import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Search, AlertCircle, Loader2, ShieldCheck, Link2, Table, Database, CheckCircle2 } from 'lucide-react';
import '../Components/styles/BankConnect.css';

const bankDetails = {
    im: { name: 'I&M Bank', color: '#00339f' },
    mpesa: { name: 'M-Pesa', color: '#2db742' },
    kcb: { name: 'KCB Bank', color: '#7cc142' },
    equity: { name: 'Equity Bank', color: '#ad500f' }
};

const BankConnect = () => {
    const { bankId } = useParams();
    const navigate = useNavigate();
    const bank = bankDetails[bankId] || bankDetails.im;

    const [method, setMethod] = useState('pdf');
    const [loading, setLoading] = useState(false);
    const [rawRows, setRawRows] = useState(null);
    const [error, setError] = useState(null);

    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setRawRows(null);

        if (!file) {
            setError("Please select a PDF file.");
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('statement', file);
        formData.append('password', password);

        try {
            const response = await fetch(`http://localhost:5000/api/parse/${bankId}`, {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            if (result.success) {
                setRawRows(result.transactions); // The backend now sends raw rows
            } else {
                setError(result.message || "Parsing failed.");
            }
        } catch (err) {
            setError("Could not connect to parsing server. Is it running?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bc-page">
            <nav className="bc-nav">
                <button onClick={() => navigate('/banks')} className="bc-back-btn">
                    <ArrowLeft size={18} /> Back
                </button>
            </nav>

            <div className="bc-layout">
                <aside className="bc-sidebar">
                    <div className="bc-sticky-card">
                        <header className="bc-card-header" style={{ borderTop: `6px solid ${bank.color}` }}>
                            <div className="bc-bank-icon" style={{ backgroundColor: bank.color }}>{bank.name[0]}</div>
                            <h2>{bank.name}</h2>
                            <p>PDF Coordinate Inspector</p>
                        </header>

                        <form onSubmit={handleConnect} className="bc-form">
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

                            <button type="submit" className="bc-submit-btn" style={{ backgroundColor: bank.color }} disabled={loading}>
                                {loading ? <Loader2 className="bc-spin" size={20} /> : <ShieldCheck size={20} />}
                                {loading ? 'Inspecting...' : 'Inspect PDF'}
                            </button>
                            {error && <div className="bc-err"><AlertCircle size={14} /> {error}</div>}
                        </form>
                        <div className="bc-footer-note"><CheckCircle2 size={12}/> Your data is processed locally.</div>
                    </div>
                </aside>

                <main className="bc-main">
                    {rawRows ? (
                        <div className="bc-results-card">
                            <div className="bc-results-header">
                                <h3>Raw PDF Text (with X-Coordinates)</h3>
                                <p>{rawRows.length} rows found. Please copy and paste the entire content of this table in the chat.</p>
                            </div>
                            <div className="bc-table-container">
                                <table className="bc-table bc-raw-table">
                                    <thead>
                                        <tr>
                                            <th>Raw Text Content</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rawRows.map((row, idx) => (
                                            <tr key={idx}>
                                                <td>{row.text}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="bc-empty">
                            <Database size={64} />
                            <h3>Awaiting PDF</h3>
                            <p>Upload a PDF statement to inspect its text coordinates.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default BankConnect;
