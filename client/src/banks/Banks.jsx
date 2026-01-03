import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Smartphone, Search, ArrowRight } from 'lucide-react';
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
        } else {
            navigate(`/banks/connect/${id}`); // Goes to the Dynamic Connector
        }
    };

    return (
        <div className="banks-wrapper">
            <header className="banks-header">
                <div>
                    <h1>Financial Hub</h1>
                    <p>Select an account to sync or upload statements</p>
                </div>
                <div className="banks-search">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Search providers..." 
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            <div className="banks-grid">
                {filteredProviders.map((bank) => (
                    <div 
                        key={bank.id} 
                        className="bank-card" 
                        style={{ '--brand-color': bank.color }}
                        onClick={() => handleNavigation(bank.id)}
                    >
                        <div className="bank-card-content">
                            <div className="bank-icon-hex" style={{ backgroundColor: bank.color }}>
                                {bank.icon}
                            </div>
                            <div className="bank-info">
                                <h3>{bank.name}</h3>
                                <span>{bank.type}</span>
                            </div>
                        </div>
                        <div className="card-footer">
                            <span>{bank.id === 'mpesa' ? 'Open Parser' : 'Connect Account'}</span>
                            <ArrowRight size={16} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Banks;