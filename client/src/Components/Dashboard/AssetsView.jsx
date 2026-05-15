import React, { useContext } from "react";
import { WealthContext } from "../../context/wealthContext";
import "../styles/dashboard.css";
import { formatMoney } from "../../utils/money";

const AssetsView = () => {
  const { trackedWallets, totalWorth } = useContext(WealthContext);

  return (
    <div className="assets-view">
      <div className="assets-header">
        <h3>Connected Accounts & Wallets</h3>
        <p>Current worth is loaded from your parsed statement summaries.</p>
      </div>
      <div className="assets-total">
        <span>Tracked Worth</span>
        <strong>Ksh {formatMoney(totalWorth)}</strong>
      </div>
      <div className="assets-container">
        {trackedWallets.map((asset) => (
          <div className="asset-card" key={asset.key} style={{ borderTop: `4px solid ${asset.accent}` }}>
            <h4>{asset.name}</h4>
            <p>Ksh {formatMoney(asset.worth)}</p>
            <span>{asset.customerName || asset.accountNumber || "No account details captured yet"}</span>
            {asset.accountType ? <span>{asset.accountType}</span> : null}
            <small>{asset.statementPeriod || "No statement period captured"}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsView;
