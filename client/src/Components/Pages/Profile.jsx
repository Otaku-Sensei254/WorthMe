import React, { useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "../../context/userContext";
import { WealthContext } from "../../context/wealthContext";
import { Link } from "react-router-dom";
import "../styles/profile.css";
import { formatMoney } from "../../utils/money";
import { recurringMonthlyEquivalent, recurringScheduleLabel } from "../../utils/recurring";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const Profile = () => {
  const { user } = useContext(UserContext);
  const { trackedWallets, totalWorth, totalTrackedTransactions, wealthState } = useContext(WealthContext);

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [recurringItems, setRecurringItems] = useState([]);
  const [recurringLoading, setRecurringLoading] = useState(true);
  const [recurringError, setRecurringError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    const loadRecurringItems = async () => {
      if (!user?.id) {
        setRecurringItems([]);
        setRecurringLoading(false);
        return;
      }

      setRecurringLoading(true);
      try {
        const response = await fetch(`${API_BASE}/api/planning/recurring`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load recurring items.");
        if (isCurrent) {
          setRecurringItems(data.items || []);
          setRecurringError("");
        }
      } catch (error) {
        if (isCurrent) setRecurringError(error.message || "Could not load recurring items.");
      } finally {
        if (isCurrent) setRecurringLoading(false);
      }
    };

    loadRecurringItems();
    return () => { isCurrent = false; };
  }, [user?.id]);

  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
    user?.name ||
    user?.email ||
    "User";

  const profileFields = [
    { label: "Email", value: user?.email || "Not available yet" },
    { label: "Phone", value: user?.phone || "Not available yet" },
    { label: "Tracked Worth", value: `Ksh ${formatMoney(totalWorth)}` },
  ];

  const totalRecurring = useMemo(
    () => recurringItems.filter((item) => item.active).reduce((sum, item) => sum + recurringMonthlyEquivalent(item), 0),
    [recurringItems]
  );

  const uploadOptions = [
    { label: "M-Pesa", to: "/mpesa" },
    { label: "Airtel Money", to: "/airtel" },
    { label: "I&M Bank", to: "/banks/connect/im" },
  ];

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="profile-eyebrow">Session-based profile</p>
          <h1>{displayName}</h1>
          <p>
            This profile uses your logged-in session data plus the M-Pesa, Airtel, and I&M statement balances parsed in the browser.
          </p>
        </div>
        <div className="profile-hero-actions">
          <Link to="/dashboard" className="profile-action">Back to Dashboard</Link>
          <button
            type="button"
            className="profile-action secondary"
            onClick={() => setIsUploadOpen(true)}
          >
            Upload Statement
          </button>
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

      <section className="profile-panel">
        <div className="profile-recurring-heading">
          <div>
            <h2>Recurring expenses</h2>
            <p>These are the same recurring items saved in your dashboard.</p>
          </div>
          <div className="profile-recurring-actions">
            <span>{recurringItems.length} {recurringItems.length === 1 ? "ITEM" : "ITEMS"}</span>
            <Link to="/dashboard?section=recurring" className="profile-action secondary">Manage</Link>
          </div>
        </div>
        <div className="profile-recurring-total">
          <span>Active monthly equivalent</span>
          <strong>Ksh {formatMoney(totalRecurring)}</strong>
        </div>

        <div className="profile-recurring-list">
          {recurringLoading ? (
            <p className="profile-recurring-message">Loading your recurring items…</p>
          ) : recurringError ? (
            <p className="profile-recurring-message is-error" role="alert">{recurringError}</p>
          ) : recurringItems.length === 0 ? (
            <p className="profile-recurring-message">No recurring items yet. Add them from the dashboard’s Recurring section.</p>
          ) : (
            recurringItems.map((item) => (
              <div key={item.id} className={`profile-recurring-item ${item.active ? "" : "is-paused"}`}>
                <div className="profile-recurring-item-info">
                  <strong>{item.name}</strong>
                  <small>{item.category} · {recurringScheduleLabel(item)}{item.active ? "" : " · Paused"}</small>
                </div>
                <div className="profile-recurring-item-amount">
                  <span>Ksh {formatMoney(item.amount)}</span>
                  <small>per {item.frequency === "daily" ? "day" : item.frequency === "weekly" ? "week" : item.frequency === "yearly" ? "year" : "month"}</small>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="profile-panel profile-wallets">
        <h2>Wallet Snapshots</h2>
        <div className="profile-wallet-grid">
          {trackedWallets.map((wallet) => (
            <article key={wallet.key} className="profile-wallet-card" style={{ borderTop: `4px solid ${wallet.accent}` }}>
              <div className="profile-wallet-header">
                <h3>{wallet.name}</h3>
                <span>Ksh {formatMoney(wallet.worth)}</span>
              </div>
              <p>{wallet.customerName || wallet.accountNumber || "Account details will appear after you upload a statement."}</p>
              <small>{wallet.statementPeriod || "Statement period not captured yet."}</small>
            </article>
          ))}
        </div>
      </section>

      {isUploadOpen && (
        <div
          className="profile-modal-backdrop"
          onClick={() => setIsUploadOpen(false)}
          role="presentation"
        >
          <div
            className="profile-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-statement-title"
          >
            <h2 id="upload-statement-title">Upload Statement</h2>
            <p>Choose the statement type you want to upload.</p>
            <div className="profile-upload-options">
              {uploadOptions.map((option) => (
                <Link
                  key={option.to}
                  to={option.to}
                  className="profile-action secondary"
                  onClick={() => setIsUploadOpen(false)}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <button
              type="button"
              className="profile-action"
              onClick={() => setIsUploadOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
