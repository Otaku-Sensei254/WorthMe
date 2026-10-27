import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney, normalizeMoney } from "../../../utils/money";
import "../../styles/dashboard.css";

const BudgetView = () => {
  const { spendingInsights } = useContext(WealthContext);
  const totalSpent = normalizeMoney(spendingInsights?.totalSpent || 0);

  // 50/30/20 Budgeting model estimates based on parsed spend
  const estimatedIncome = totalSpent > 0 ? totalSpent * 1.3 : 150000;
  const needsBudget = estimatedIncome * 0.5;
  const wantsBudget = estimatedIncome * 0.3;
  const savingsBudget = estimatedIncome * 0.2;

  const actualNeeds = totalSpent * 0.65;
  const actualWants = totalSpent * 0.35;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Monthly Budget & Targets</h3>
          <p>Rule-based budgeting and expense envelopes tailored to your monthly cash flow.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Target Monthly Income</span>
          <strong>Ksh {formatMoney(estimatedIncome)}</strong>
          <small>Estimated baseline</small>
        </div>
        <div className="metric-box">
          <span>Current Month Outflow</span>
          <strong className="text-rose">Ksh {formatMoney(totalSpent)}</strong>
          <small>Total statement spend recorded</small>
        </div>
        <div className="metric-box">
          <span>Target Savings (20%)</span>
          <strong className="text-emerald">Ksh {formatMoney(savingsBudget)}</strong>
          <small>Recommended wealth building envelope</small>
        </div>
      </div>

      <div className="budget-envelopes-grid">
        <div className="budget-card">
          <div className="budget-card-header">
            <div>
              <h4>Essentials & Living (50%)</h4>
              <p>Rent, groceries, utilities, transit & KPLC</p>
            </div>
            <strong>Ksh {formatMoney(actualNeeds)} / Ksh {formatMoney(needsBudget)}</strong>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (actualNeeds / (needsBudget || 1)) * 100)}%`,
                background: "#34d399",
              }}
            />
          </div>
          <span className="budget-status-text">
            {actualNeeds > needsBudget ? "Over budget limit" : "Within planned envelope"}
          </span>
        </div>

        <div className="budget-card">
          <div className="budget-card-header">
            <div>
              <h4>Discretionary & Wants (30%)</h4>
              <p>Dining out, entertainment, shopping & airtime</p>
            </div>
            <strong>Ksh {formatMoney(actualWants)} / Ksh {formatMoney(wantsBudget)}</strong>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${Math.min(100, (actualWants / (wantsBudget || 1)) * 100)}%`,
                background: "#f4e8cf",
              }}
            />
          </div>
          <span className="budget-status-text">
            {actualWants > wantsBudget ? "Over discretionary limit" : "Healthy discretionary buffer"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
