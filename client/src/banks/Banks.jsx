import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Smartphone, Search, ArrowRight, Landmark, WalletCards } from 'lucide-react';
import '../Components/styles/Banks.css';

const providers = [
    { id: 'im', name: 'I&M Bank', type: 'Bank', color: '#00339f', icon: <Building2 /> },
    { id: 'kcb', name: 'KCB Bank', type: 'Bank', color: '#7cc142', icon: <Building2 /> },
    { id: 'equity', name: 'Equity Bank', type: 'Bank', color: '#ad500f', icon: <Building2 /> },
    { id: 'coop', name: 'Co-op Bank', type: 'Bank', color: '#1f4931', icon: <Building2 /> },
    { id: 'airtel', name: 'Airtel Money', type: 'Mobile Money', color: '#ff0000', icon: <Smartphone /> },
    { id: 'mpesa', name: 'M-Pesa', type: 'Mobile Money', color: '#2db742', icon: <Smartphone /> },
];

const Banks = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const filteredProviders = providers.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleNavigation = (id) => {
        if (id === 'mpesa') {
            navigate('/mpesa'); // Goes to your specialized M-Pesa page
        } else if (id === 'airtel') {
            navigate('/airtel'); // Goes to your specialized Airtel Money page
        } else {
            navigate(`/banks/connect/${id}`); // Goes to the Dynamic Connector
        }
    };

    return (
        <main className="banks-wrapper">
            <header className="banks-header">
                <div>
                    <span className="banks-eyebrow"><span /> Accounts &amp; providers</span>
                    <h1>Your financial accounts</h1>
                    <p>Choose a bank or wallet to import your statement and review activity.</p>
                </div>
                <label className="banks-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                        type="text" 
                        aria-label="Search banks and mobile money providers"
                        placeholder="Find a provider"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </label>
            </header>

            <section className="banks-section" aria-labelledby="banks-section-title">
                <div className="banks-section-heading">
                    <div>
                        <h2 id="banks-section-title">Available providers</h2>
                        <p>Import a statement to see your account activity in one place.</p>
                    </div>
                    <span className="banks-count">{filteredProviders.length} {filteredProviders.length === 1 ? 'provider' : 'providers'}</span>
                </div>

                {filteredProviders.length > 0 ? (
                    <div className="banks-grid">
                        {filteredProviders.map((bank) => (
                            <button
                                type="button"
                                key={bank.id}
                                className="bank-card"
                                style={{ '--brand-color': bank.color }}
                                onClick={() => handleNavigation(bank.id)}
                            >
                                <span className="bank-card-accent" />
                                <span className="bank-card-content">
                                    <span className="bank-card-topline">
                                        <span className="bank-icon" style={{ '--brand-color': bank.color }}>
                                            {bank.icon}
                                        </span>
                                        <span className="bank-card-arrow"><ArrowRight size={17} /></span>
                                    </span>
                                    <span className="bank-info">
                                        <span className="bank-type">{bank.type === 'Bank' ? <Landmark size={13} /> : <WalletCards size={13} />}{bank.type}</span>
                                        <span className="bank-name">{bank.name}</span>
                                    </span>
                                    <span className="card-footer">
                                        <span>{bank.id === 'mpesa' || bank.id === 'airtel' ? 'View transactions' : 'Import statement'}</span>
                                        <span className="card-footer-arrow"><ArrowRight size={15} /></span>
                                    </span>
                                </span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="banks-empty">
                        <Search size={20} />
                        <h3>No providers found</h3>
                        <p>Try another bank or mobile money provider name.</p>
                    </div>
                )}
            </section>
        </main>
    );
};

export default Banks;
