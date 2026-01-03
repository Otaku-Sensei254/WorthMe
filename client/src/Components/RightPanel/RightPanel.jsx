import React from "react";
import "../styles/dashboard.css";

const RightPanel = () => {
  const transactions = [
    { date: "2025-09-10", description: "M-PESA payment", amount: 500, account: "M-PESA" },
    { date: "2025-09-09", description: "CO-OP deposit", amount: 2000, account: "CO-OP" },
    { date: "2025-09-08", description: "KCB withdrawal", amount: -1500, account: "KCB" },
  ];

  return (
    <div className="right-panel">
      <h3>Recent Transactions</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Account</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx, index) => (
            <tr key={index}>
              <td>{tx.date}</td>
              <td>{tx.description}</td>
              <td>{tx.amount}</td>
              <td>{tx.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RightPanel;
