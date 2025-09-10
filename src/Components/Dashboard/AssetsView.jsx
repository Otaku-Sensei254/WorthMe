import React from "react";
import "../styles/dashboard.css";

const AssetsView = () => {
  const assets = [
    { name: "CO-OP", balance: "$3,500" },
    { name: "KCB", balance: "$4,200" },
    { name: "I&M", balance: "$2,750" },
    { name: "M-PESA", balance: "$1,800" },
    { name: "Airtel Money", balance: "$950" },
  ];

  return (
    <div className="assets-view">
      <h3>Connected Accounts & Wallets</h3>
      <div className="assets-container">
        {assets.map((asset, index) => (
          <div className="asset-card" key={index}>
            <h4>{asset.name}</h4>
            <p>{asset.balance}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetsView;
