import React from "react";
import Card from "./Card";
import "../styles/dashboard.css";

const DashboardView = () => {
  const cards = [
    { title: "Net Worth", value: "$12,450", color: "#ffd700" },
    { title: "Income", value: "$4,200", color: "#4caf50" },
    { title: "Expenses", value: "$2,300", color: "#f44336" },
    { title: "Savings", value: "$6,000", color: "#2196f3" },
  ];

  return (
    <div className="dashboard-view">
      <div className="cards-container">
        {cards.map((card, index) => (
          <Card key={index} title={card.title} value={card.value} color={card.color} />
        ))}
      </div>
      <div className="charts-placeholder">
        <h3>Charts will appear here</h3>
      </div>
    </div>
  );
};

export default DashboardView;
