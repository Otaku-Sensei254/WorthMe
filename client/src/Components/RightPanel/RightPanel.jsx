import React, { useContext } from "react";
import { WealthContext } from "../../context/wealthContext";
import "../styles/dashboard.css";

const RightPanel = () => {
  const { recentTransactions } = useContext(WealthContext);

  return (
    <div className="right-panel">
      <h3>Recent Transactions</h3>
      {recentTransactions.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.map((tx, index) => (
              <tr key={index}>
                <td>{tx.provider}</td>
                <td>{tx.label}</td>
                <td>{tx.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state">
          Upload an M-Pesa, Airtel, or I&M statement to populate this panel with real transactions.
        </p>
      )}
    </div>
  );
};

export default RightPanel;
