import React from 'react';
import { Upload, FileText, PieChart, Shield, Wallet, Search } from 'lucide-react';
import '../styles/Features.css';

const Features = () => {
  const features = [
    {
      icon: <Upload size={32} />,
      title: 'Statement Upload',
      description: 'Upload M-Pesa and Airtel Money PDF statements with ease. No password required for Airtel, secure parsing for all.'
    },
    {
      icon: <FileText size={32} />,
      title: 'Transaction History',
      description: 'View detailed transaction tables with search and filter capabilities. Find any transaction instantly.'
    },
    {
      icon: <PieChart size={32} />,
      title: 'Wealth Summary',
      description: 'Get a consolidated view of your total worth across all connected wallets and accounts.'
    },
    {
      icon: <Wallet size={32} />,
      title: 'Multi-Platform Support',
      description: 'Track both M-Pesa and Airtel Money balances in one unified dashboard.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Privacy Protected',
      description: 'Your data stays in your browser session. No persistent storage of sensitive financial information.'
    },
    {
      icon: <Search size={32} />,
      title: 'Smart Search',
      description: 'Quickly search through transactions by description, receipt number, or transaction ID.'
    }
  ];

  return (
    <div className="features-container">
      <div className="features-hero">
        <h1>Features</h1>
        <p className="features-tagline">
          Everything you need to track your mobile money wealth
        </p>
      </div>

      <div className="features-grid">
        {features.map((feature, index) => (
          <div className="feature-card" key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
