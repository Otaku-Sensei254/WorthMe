import React from "react";
import "../styles/dashboard.css";

const Sidebar = ({ activeSection, setActiveSection }) => {
  const menuItems = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Assets", key: "assets" },
    { name: "Settings", key: "settings" },
  ];

  return (
    <div className="sidebar">
      <h2 className="logo">Worth<span>Me</span></h2>
      <ul className="menu">
        {menuItems.map((item) => (
          <li
            key={item.key}
            className={activeSection === item.key ? "active" : ""}
            onClick={() => setActiveSection(item.key)}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
