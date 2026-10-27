import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney, normalizeMoney } from "../../../utils/money";
import "../../styles/dashboard.css";

const HoldingsView = () => {
  const { totalWorth } = useContext(WealthContext);
  const total = normalizeMoney(totalWorth);

  const allocations = [
    {
      category: "Liquid Mobile Wallets (M-Pesa & Airtel)",
      share: total > 0 ? "45%" : "0%",
      notes: "Everyday transaction balance and immediate liquidity",
      accent: "#34d399",
    },
    {
      category: "Commercial Banking (I&M Bank & Checking)",
      share: total > 0 ? "35%" : "0%",
      notes: "Primary operational and clearing accounts",
      accent: "#f4e8cf",
    },
    {
      category: "High-Yield & Reserves (MMFs & SACCOs)",
      share: total > 0 ? "20%" : "0%",
      notes: "Emergency fund reserves and interest-bearing deposits",
      accent: "#ff7a00",
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Portfolio Holdings & Asset Allocation</h3>
          <p>Distribution of assets between cash liquidity, capital reserves, and fixed deposits.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Aggregated Holdings Value</span>
          <strong className="text-champagne">Ksh {formatMoney(totalWorth)}</strong>
          <small>Statement backed total</small>
        </div>
        <div className="metric-box">
          <span>Asset Diversity Score</span>
          <strong className="text-emerald">High Liquidity</strong>
          <small>3 distinct channels connected</small>
        </div>
        <div className="metric-box">
          <span>Target Allocation Ratio</span>
          <strong>50 / 30 / 20</strong>
          <small>Cash / Reserves / Growth</small>
        </div>
      </div>

      <div className="holdings-list">
        {allocations.map((a, i) => (
          <div key={i} className="holding-card">
            <div className="holding-card-top">
              <div className="holding-title-row">
                <span className="dot-indicator" style={{ background: a.accent }} />
                <h4>{a.category}</h4>
              </div>
              <strong className="holding-share" style={{ color: a.accent }}>{a.share}</strong>
            </div>
            <p className="holding-notes">{a.notes}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HoldingsView;
