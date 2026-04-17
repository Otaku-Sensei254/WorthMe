import React, { useContext } from "react";
import { UserContext } from "../../context/userContext";
import { WealthContext } from "../../context/wealthContext";
import Card from "./Card";
import "../styles/dashboard.css";
import { Link } from "react-router-dom";

const DashboardView = () => {
  const { user } = useContext(UserContext);
  const { trackedWallets, totalWorth, totalTrackedTransactions } = useContext(WealthContext);
  const firstName = user?.first_name || user?.name || user?.email || "there";
  const mpesa = trackedWallets.find((wallet) => wallet.key === "mpesa");
  const airtel = trackedWallets.find((wallet) => wallet.key === "airtel");

  const cards = [
    {
      title: "Tracked Worth",
      value: `Ksh ${totalWorth}`,
      color: "#ffd166",
      subtitle: "M-Pesa + Airtel balances",
    },
    {
      title: "M-Pesa",
      value: `Ksh ${mpesa?.worth || "0.00"}`,
      color: "#2db742",
      subtitle: mpesa?.statementPeriod || "Waiting for statement upload",
    },
    {
      title: "Airtel Money",
      value: `Ksh ${airtel?.worth || "0.00"}`,
      color: "#e60000",
      subtitle: airtel?.statementPeriod || "Waiting for statement upload",
    },
    {
      title: "Tracked Transactions",
      value: `${totalTrackedTransactions}`,
      color: "#60a5fa",
      subtitle: "Parsed from uploaded statements",
    },
  ];

  return (
    <div className="dashboard-view">
      <div className="dashboard-hero">
        <div>
          <p className="dashboard-eyebrow">Temporary in-memory profile</p>
          <h2>Welcome back, {firstName}</h2>
          <p className="dashboard-copy">
            Your current worth is derived from the actual M-Pesa and Airtel statement balances you have uploaded.
          </p>
        </div>
        <div className="dashboard-hero-actions">
          <Link to="/profile" className="dashboard-hero-link">Open Profile</Link>
          <Link to="/mpesa" className="dashboard-hero-link secondary">Upload M-Pesa</Link>
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
      <div className="charts-placeholder">
        <h3>Statement-backed worth only</h3>
        <p>
          No database yet. The figures above come from the parsed statement summaries and are stored in the browser for this session.
        </p>
      </div>
    </div>
  );
};

export default DashboardView;
