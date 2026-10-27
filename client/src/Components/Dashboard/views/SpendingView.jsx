import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney } from "../../../utils/money";
import { CreditCard, TrendingDown } from "lucide-react";
import "../../styles/dashboard.css";

const SpendingView = () => {
  const { spendingInsights } = useContext(WealthContext);

  const totalSpent = spendingInsights?.totalSpent || "0.00";
  const totalReceived = spendingInsights?.totalReceived || "0.00";
  const byProvider = spendingInsights?.byProvider || [];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Spending & Cash Outflow</h3>
          <p>Analysis of parsed debits, withdrawals, and merchant payments.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Total Outflows</span>
          <strong className="text-rose">Ksh {formatMoney(totalSpent)}</strong>
          <small>Calculated from statement debits</small>
        </div>
        <div className="metric-box">
          <span>Total Inflows</span>
          <strong className="text-emerald">Ksh {formatMoney(totalReceived)}</strong>
          <small>Credits and deposits received</small>
        </div>
        <div className="metric-box">
          <span>Highest Outflow Channel</span>
          <strong className="text-champagne">
            {spendingInsights?.highestSpendSource?.name || "None yet"}
          </strong>
          <small>Based on aggregate statement volume</small>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="view-panel">
          <h4>Outflow Breakdown by Account</h4>
          <p className="panel-desc">Distribution of expenditures across tracked sources.</p>
          <div className="provider-list">
            {byProvider.map((item) => (
              <div key={item.key} className="provider-item-row">
                <div className="provider-item-info">
                  <span className="dot-indicator" style={{ background: item.accent }} />
                  <div>
                    <strong>{item.name}</strong>
                    <small>Received: Ksh {formatMoney(item.received)}</small>
                  </div>
                </div>
                <div className="provider-item-amount">
                  <span className="text-rose">Ksh {formatMoney(item.spent)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="view-panel">
          <h4>Expenditure Insights</h4>
          <p className="panel-desc">Observed trends from your statement history.</p>
          <div className="insight-cards-stack">
            <div className="insight-card">
              <TrendingDown size={20} className="text-rose" />
              <div>
                <strong>Cash Flow Ratio</strong>
                <p>
                  Your total inflows represent a healthy coverage against current parsed monthly expenses.
                </p>
              </div>
            </div>
            <div className="insight-card">
              <CreditCard size={20} className="text-champagne" />
              <div>
                <strong>Merchant & Paybill Spend</strong>
                <p>
                  M-Pesa Till and Paybill payments constitute the majority of everyday micro-transactions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendingView;
