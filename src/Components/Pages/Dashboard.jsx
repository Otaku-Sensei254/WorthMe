import React, { useState } from "react";
import Sidebar from "../Dashboard/SideBar";
import MiddleContent from "../Dashboard/MiddleContent";
import RightPanel from "../RightPanel/RightPanel";
import "../styles/dashboard.css";

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="dashboard-container">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      <MiddleContent activeSection={activeSection} />
      <RightPanel />
    </div>
  );
};

export default DashboardPage;
