import React from "react";
import "../../styles/dashboard.css";

const InvestmentsView = () => {
  const funds = [
    {
      name: "CIC Money Market Fund",
      type: "Money Market Fund (MMF)",
      currentYield: "14.85% p.a.",
      risk: "Low Risk",
      payout: "Daily compounding / Monthly payout",
    },
    {
      name: "Sanlam Money Market Fund",
      type: "Money Market Fund (MMF)",
      currentYield: "15.20% p.a.",
      risk: "Low Risk",
      payout: "Daily compounding",
    },
    {
      name: "Etica Money Market Fund",
      type: "Money Market Fund (MMF)",
      currentYield: "16.10% p.a.",
      risk: "Low-Medium Risk",
      payout: "Daily compounding",
    },
    {
      name: "Stima SACCO Deposit Accounts",
      type: "Cooperative Savings",
      currentYield: "15.00% dividend",
      risk: "Medium Risk",
      payout: "Annual dividend distribution",
    },
    {
      name: "CBK Treasury Infrastructure Bond (IFB)",
      type: "Government Bond",
      currentYield: "17.95% tax-free",
      risk: "Sovereign / Backed by Gov",
      payout: "Semi-annual coupon",
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Investment Portfolios & High-Yield Vehicles</h3>
          <p>Tracked and benchmarked yields across Kenyan Money Market Funds, SACCOs, and Government Securities.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Top Local MMF Benchmark</span>
          <strong className="text-emerald">16.10% p.a.</strong>
          <small>Etica Wealth MMF</small>
        </div>
        <div className="metric-box">
          <span>Treasury Infrastructure Bond</span>
          <strong className="text-champagne">17.95% Tax-Free</strong>
          <small>CBK Infrastructure Yield</small>
        </div>
        <div className="metric-box">
          <span>Inflation Benchmark (KNBS)</span>
          <strong className="text-white">4.3% YoY</strong>
          <small>Positive real yield buffer</small>
        </div>
      </div>

      <div className="card-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Vehicle / Institution</th>
              <th>Category</th>
              <th>Historical Yield</th>
              <th>Risk Profile</th>
              <th className="text-right">Payout Schedule</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((f, i) => (
              <tr key={i}>
                <td>
                  <strong>{f.name}</strong>
                </td>
                <td>
                  <span className="source-tag">{f.type}</span>
                </td>
                <td className="text-emerald font-bold">{f.currentYield}</td>
                <td className="text-muted">{f.risk}</td>
                <td className="text-right text-muted">{f.payout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvestmentsView;
