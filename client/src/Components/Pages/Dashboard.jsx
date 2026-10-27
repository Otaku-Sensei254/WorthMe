import React, { useState, useEffect } from "react";
import Sidebar from "../Dashboard/SideBar";
import MiddleContent from "../Dashboard/MiddleContent";
import RightPanel from "../RightPanel/RightPanel";
import Footer from "../Footer/Footer";
import "../styles/dashboard.css";

const DashboardPage = () => {
  const [activeSection, setActiveSection] = useState("home");
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("worthme_sidebar_collapsed") === "true";
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("worthme_sidebar_collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!isMobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 641px)");
    const closeOnDesktop = (event) => {
      if (event.matches) setIsMobileNavOpen(false);
    };

    desktopViewport.addEventListener("change", closeOnDesktop);
    return () => desktopViewport.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <div className={`dashboard-app-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>
      <Sidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileNavOpen}
        setIsMobileOpen={setIsMobileNavOpen}
      />
      <main className="dashboard-main-canvas">
        <div className="dashboard-content-stage">
          <MiddleContent activeSection={activeSection} />
          {activeSection === "home" && <RightPanel />}
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default DashboardPage;
