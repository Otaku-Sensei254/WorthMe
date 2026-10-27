import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney, normalizeMoney } from "../../../utils/money";
import { Target, ShieldCheck, Home } from "lucide-react";
import "../../styles/dashboard.css";

const GoalsView = () => {
  const { totalWorth } = useContext(WealthContext);
  const currentTotal = normalizeMoney(totalWorth);

  const goals = [
    {
      id: "emergency-fund",
      title: "6-Month Emergency Runway",
      category: "Safety Net",
      target: 350000,
      current: Math.min(350000, currentTotal * 0.4),
      deadline: "December 2026",
      icon: ShieldCheck,
      color: "#34d399",
    },
    {
      id: "land-deposit",
      title: "Land / Plot Downpayment",
      category: "Real Estate",
      target: 800000,
      current: Math.min(800000, currentTotal * 0.35),
      deadline: "June 2027",
      icon: Home,
      color: "#f4e8cf",
    },
    {
      id: "sacco-shares",
      title: "SACCO Capital Shares & Deposit",
      category: "High Yield",
      target: 500000,
      current: Math.min(500000, currentTotal * 0.25),
      deadline: "October 2026",
      icon: Target,
      color: "#ff7a00",
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Financial Goals & Milestones</h3>
          <p>Active targets mapped against your aggregated statement balances.</p>
        </div>
      </div>

      <div className="goals-grid">
        {goals.map((g) => {
          const Icon = g.icon;
          const percentage = Math.min(100, Math.round((g.current / g.target) * 100));

          return (
            <div key={g.id} className="goal-card">
              <div className="goal-card-top">
                <div className="goal-icon-wrap" style={{ color: g.color }}>
                  <Icon size={22} />
                </div>
                <span className="goal-category-pill">{g.category}</span>
              </div>

              <h4>{g.title}</h4>
              <p className="goal-deadline">Target date: {g.deadline}</p>

              <div className="goal-progress-wrap">
                <div className="progress-bar-bg">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${percentage}%`, background: g.color }}
                  />
                </div>
                <div className="goal-numbers-row">
                  <span>Ksh {formatMoney(g.current)} saved</span>
                  <strong>{percentage}%</strong>
                </div>
                <small className="goal-remaining">
                  Goal target: Ksh {formatMoney(g.target)}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsView;
