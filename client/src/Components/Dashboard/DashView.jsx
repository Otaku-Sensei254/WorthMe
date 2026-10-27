import React, { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import { WealthContext } from "../../context/wealthContext";
import Card from "./Card";
import "../styles/dashboard.css";
import { Link } from "react-router-dom";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { formatMoney } from "../../utils/money";

const DashboardView = () => {
  const { user } = useContext(UserContext);
  const { trackedWallets, totalWorth, totalTrackedTransactions, spendingInsights, saveWalletSnapshot } = useContext(WealthContext);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'requesting', 'polling', 'success', 'error'
  const [error, setError] = useState(null);

  const firstName = user?.first_name ||  "there";
  const mpesa = trackedWallets.find((wallet) => wallet.key === "mpesa");
  const airtel = trackedWallets.find((wallet) => wallet.key === "airtel");
  const im = trackedWallets.find((wallet) => wallet.key === "im");

  const handleMpesaSync = async () => {
    setIsSyncing(true);
    setSyncStatus('requesting');
    setError(null);

    try {
      // 1. Send the sync request to Phoenix
      const response = await fetch('http://localhost:4000/api/mpesa/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();

      if (result.conversation_id) {
        setSyncStatus('polling');
        startPolling(result.conversation_id);
      } else {
        throw new Error(result.error || "Failed to start sync");
      }
    } catch (err) {
      setError(err.message);
      setSyncStatus('error');
      setIsSyncing(false);
    }
  };

  const startPolling = async (conversationId) => {
    let attempts = 0;
    const maxAttempts = 10; // Poll for 30 seconds (3s intervals)
    
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await fetch(`http://localhost:4000/api/mpesa/status/${conversationId}`);
        const result = await response.json();

        if (result.status === 'completed') {
          clearInterval(interval);
          
          // Extract balance from the complex Safaricom result structure
          // Safaricom ResultParameters usually look like: [{Key: "AccountBalance", Value: "Ksh 100.00|..."}]
          const params = result.data?.ResultParameters?.ResultParameter || [];
          const balanceParam = params.find(p => p.Key === "AccountBalance");
          const balanceValue = balanceParam ? balanceParam.Value.split('|')[0].replace(/[^\d.]/g, '') : "0.00";

          saveWalletSnapshot('mpesa', {
            provider: 'M-Pesa',
            label: 'Live M-Pesa Wallet',
            worth: balanceValue,
            balance: balanceValue,
            summary: { currentBalance: balanceValue },
            lastSynced: new Date().toLocaleTimeString(),
            isLive: true
          });

          setSyncStatus('success');
          setIsSyncing(false);
          setTimeout(() => setSyncStatus(null), 5000); // Clear success message after 5s
        } else if (attempts >= maxAttempts) {
          clearInterval(interval);
          setError("Sync timed out. Try again.");
          setSyncStatus('error');
          setIsSyncing(false);
        }
      } catch (err) {
        clearInterval(interval);
        setError("Polling failed");
        setSyncStatus('error');
        setIsSyncing(false);
      }
    }, 3000);
  };

  const cards = [
    {
      title: "Net Worth",
      value: `Ksh ${formatMoney(totalWorth)}`,
      color: "#ffd166",
      subtitle: "M-Pesa + Airtel + I&M balances",
    },
    {
      title: "M-Pesa",
      value: `Ksh ${formatMoney(mpesa?.worth || "0.00")}`,
      color: "#2db742",
      subtitle: mpesa?.isLive ? `Live Sync: ${mpesa.lastSynced}` : (mpesa?.statementPeriod || "Waiting for sync/upload"),
    },
    {
      title: "Airtel Money",
      value: `Ksh ${formatMoney(airtel?.worth || "0.00")}`,
      color: "#e60000",
      subtitle: airtel?.statementPeriod || "Waiting for statement upload",
    },
    {
      title: "I&M Bank",
      value: `Ksh ${formatMoney(im?.worth || "0.00")}`,
      color: "#00339f",
      subtitle: im?.statementPeriod || "Waiting for bank statement upload",
    },
    {
      title: "Spending",
      value: `Ksh ${formatMoney(spendingInsights?.totalSpent || "0.00")}`,
      color: "#60a5fa",
      subtitle: `${totalTrackedTransactions} parsed transactions`,
    },
  ];

  return (
    <div className="dashboard-view">
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <p className="dashboard-eyebrow">Portfolio Overview</p>
          <h2>Welcome back, <em>{firstName}</em></h2>
          <p className="dashboard-copy">
            All your wealth in one calm place. Real-time balances and statement insights across M-Pesa, Airtel Money, and bank accounts.
          </p>
          
          <div className="sync-actions">
            <button 
              onClick={handleMpesaSync} 
              disabled={isSyncing}
              className={`sync-btn ${isSyncing ? 'syncing' : ''}`}
              type="button"
            >
              {isSyncing ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
              {isSyncing ? 'Syncing M-Pesa...' : 'Sync M-Pesa Live'}
            </button>

            {syncStatus === 'success' && (
              <span className="sync-status success" role="status">
                <CheckCircle size={16} /> Synced
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="sync-status error" role="alert">
                <AlertCircle size={16} /> {error || 'Failed'}
              </span>
            )}
          </div>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/mpesa" className="dashboard-hero-link">Upload Statement</Link>
          <Link to="/banks/connect/im" className="dashboard-hero-link secondary">Upload I&M</Link>
          <Link to="/profile" className="dashboard-hero-link secondary">Profile</Link>
        </div>
      </div>

      <div className="cards-container">
        {cards.map((card, index) => (
          <Card
            key={index}
            title={card.title}
            value={card.value}
            color={card.color}
            subtitle={card.subtitle}
          />
        ))}
      </div>

      <div className="spending-overview">
        <div className="spending-summary-card">
          <span>Total Spent</span>
          <strong>Ksh {formatMoney(spendingInsights.totalSpent)}</strong>
          <small>Withdrawals and debits across parsed statements</small>
        </div>
        <div className="spending-summary-card">
          <span>Total Received</span>
          <strong>Ksh {formatMoney(spendingInsights.totalReceived)}</strong>
          <small>Deposits and credits across parsed statements</small>
        </div>
        <div className="spending-summary-card">
          <span>Net Movement</span>
          <strong>Ksh {formatMoney(spendingInsights.netMovement)}</strong>
          <small>{spendingInsights.highestSpendSource?.name || "No source"} has the highest spend</small>
        </div>
        <div className="provider-breakdown">
          <h3>Provider Breakdown</h3>
          {spendingInsights.byProvider.map((item) => (
            <div className="provider-breakdown-row" key={item.key}>
              <span style={{ borderLeftColor: item.accent }}>{item.name}</span>
              <strong>Spent Ksh {formatMoney(item.spent)}</strong>
              <small>Received Ksh {formatMoney(item.received)}</small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
