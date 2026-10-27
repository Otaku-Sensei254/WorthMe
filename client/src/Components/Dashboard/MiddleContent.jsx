import React from "react";
import DashboardView from "./DashView";
import AssetsView from "./AssetsView";
import SettingsView from "./SettingsView";
import TransactionsView from "./views/TransactionsView";
import SpendingView from "./views/SpendingView";
import BudgetView from "./views/BudgetView";
import GoalsView from "./views/GoalsView";
import RecurringView from "./views/RecurringView";
import ReportsView from "./views/ReportsView";
import InvestmentsView from "./views/InvestmentsView";
import HoldingsView from "./views/HoldingsView";
import MarketWatchView from "./views/MarketWatchView";
import CreditScoreView from "./views/CreditScoreView";
import EquityView from "./views/EquityView";
import "../styles/dashboard.css";

const MiddleContent = ({ activeSection }) => {
  return (
    <div className="middle-content">
      {activeSection === "home" && <DashboardView />}
      {activeSection === "assets" && <AssetsView />}
      {activeSection === "spending" && <SpendingView />}
      {activeSection === "transactions" && <TransactionsView />}
      {activeSection === "budget" && <BudgetView />}
      {activeSection === "goals" && <GoalsView />}
      {activeSection === "recurring" && <RecurringView />}
      {activeSection === "reports" && <ReportsView />}
      {activeSection === "investments" && <InvestmentsView />}
      {activeSection === "holdings" && <HoldingsView />}
      {activeSection === "market-watch" && <MarketWatchView />}
      {activeSection === "credit-score" && <CreditScoreView />}
      {activeSection === "equity" && <EquityView />}
      {activeSection === "settings" && <SettingsView />}
    </div>
  );
};

export default MiddleContent;
