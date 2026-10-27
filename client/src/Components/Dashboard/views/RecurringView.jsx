import React from "react";
import { Zap, Wifi, Shield, Smartphone, Home } from "lucide-react";
import "../../styles/dashboard.css";

const RecurringView = () => {
  const subscriptions = [
    {
      id: "rent",
      name: "Apartment Rent",
      category: "Housing",
      cost: "45,000.00",
      cycle: "Monthly",
      due: "1st of every month",
      icon: Home,
    },
    {
      id: "kplc",
      name: "KPLC Prepaid Tokens",
      category: "Utilities",
      cost: "3,500.00",
      cycle: "Monthly",
      due: "Every 25th",
      icon: Zap,
    },
    {
      id: "fiber",
      name: "Safaricom Home Fiber (50 Mbps)",
      category: "Internet",
      cost: "5,000.00",
      cycle: "Monthly",
      due: "Every 15th",
      icon: Wifi,
    },
    {
      id: "airtime",
      name: "Monthly Postpaid / Data Bundles",
      category: "Telecom",
      cost: "2,000.00",
      cycle: "Monthly",
      due: "Every 1st",
      icon: Smartphone,
    },
    {
      id: "insurance",
      name: "Health & NHIF / SHA Cover",
      category: "Insurance",
      cost: "1,700.00",
      cycle: "Monthly",
      due: "Every 9th",
      icon: Shield,
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Recurring Bills & Subscriptions</h3>
          <p>Scheduled monthly commitments detected across statement entries.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Monthly Recurring Total</span>
          <strong className="text-white">Ksh 57,200.00</strong>
          <small>Calculated fixed monthly baseline</small>
        </div>
        <div className="metric-box">
          <span>Active Subscriptions</span>
          <strong>5 Active</strong>
          <small>Tracked utility & service commitments</small>
        </div>
        <div className="metric-box">
          <span>Upcoming Charge</span>
          <strong className="text-champagne">1st of Month</strong>
          <small>Rent & Postpaid bundles</small>
        </div>
      </div>

      <div className="card-table-wrap">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Service</th>
              <th>Category</th>
              <th>Frequency</th>
              <th>Due Schedule</th>
              <th className="text-right">Estimated Cost (KES)</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => {
              const Icon = s.icon;
              return (
                <tr key={s.id}>
                  <td>
                    <div className="table-service-name">
                      <Icon size={16} className="text-champagne" />
                      <strong>{s.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="source-tag">{s.category}</span>
                  </td>
                  <td className="text-muted">{s.cycle}</td>
                  <td className="text-muted">{s.due}</td>
                  <td className="text-right font-bold text-white">
                    Ksh {s.cost}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecurringView;
