import React from "react";
import DashboardView from "./DashView";
import AssetsView from "./AssetsView";
import SettingsView from "./SettingsView";
import "../styles/dashboard.css";

const MiddleContent = ({ activeSection }) => {
  return (
    <div className="middle-content">
      {activeSection === "dashboard" && <DashboardView />}
      {activeSection === "assets" && <AssetsView />}
      {activeSection === "settings" && <SettingsView />}
    </div>
  );
};

export default MiddleContent;
