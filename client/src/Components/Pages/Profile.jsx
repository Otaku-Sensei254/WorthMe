import React, { useContext } from "react";
import { UserContext } from "../../context/userContext";
import { WealthContext } from "../../context/wealthContext";
import { Link } from "react-router-dom";
import "../styles/profile.css";

const Profile = () => {
  const { user } = useContext(UserContext);
  const { trackedWallets, totalWorth, totalTrackedTransactions, wealthState } = useContext(WealthContext);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "User";

  const profileFields = [
    { label: "Email", value: user?.email || "Not available yet" },
    { label: "Phone", value: user?.phone || "Not available yet" },
    { label: "User ID", value: user?.id || "Session-based" },
    { label: "Tracked Worth", value: `Ksh ${totalWorth}` },
  ];

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="profile-eyebrow">Session-based profile</p>
          <h1>{displayName}</h1>
          <p>
            This profile uses your logged-in session data plus the M-Pesa and Airtel statement balances parsed in the browser.
          </p>
        </div>
        <div className="profile-hero-actions">
          <Link to="/dashboard" className="profile-action">Back to Dashboard</Link>
          <Link to="/mpesa" className="profile-action secondary">Upload M-Pesa</Link>
          <Link to="/airtel" className="profile-action secondary">Upload Airtel</Link>
        </div>
      </section>

      <section className="profile-grid">
        <div className="profile-panel">
          <h2>Your Data</h2>
          <div className="profile-details">
            {profileFields.map((item) => (
              <div key={item.label} className="profile-detail">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="profile-panel">
          <h2>Statement Totals</h2>
          <div className="profile-stats">
            <div>
              <span>Tracked Wallets</span>
              <strong>{trackedWallets.length}</strong>
            </div>
            <div>
              <span>Tracked Transactions</span>
              <strong>{totalTrackedTransactions}</strong>
            </div>
            <div>
              <span>Storage Key</span>
              <strong>{wealthState ? "Browser session" : "Not initialised"}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-panel profile-wallets">
        <h2>Wallet Snapshots</h2>
        <div className="profile-wallet-grid">
          {trackedWallets.map((wallet) => (
            <article key={wallet.key} className="profile-wallet-card" style={{ borderTop: `4px solid ${wallet.accent}` }}>
              <div className="profile-wallet-header">
                <h3>{wallet.name}</h3>
                <span>Ksh {wallet.worth}</span>
              </div>
              <p>{wallet.customerName || "Customer name will appear after you upload a statement."}</p>
              <small>{wallet.statementPeriod || "Statement period not captured yet."}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Profile;

