import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../context/userContext";
import {
  Home,
  WalletCards,
  CreditCard,
  ArrowLeftRight,
  PieChart,
  Target,
  Repeat,
  FileText,
  TrendingUp,
  Briefcase,
  Activity,
  ShieldCheck,
  Scale,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  LogOut,
  Landmark,
} from "lucide-react";
import "../styles/dashboard.css";

const Sidebar = ({ activeSection, setActiveSection, isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen }) => {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.delete("http://localhost:4000/api/users/log_out", {
        withCredentials: true,
      });
      fetchUser();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const initials = (
    (user?.first_name || user?.name || user?.email || "W")[0] || "W"
  ).toUpperCase();
  const showLabels = !isCollapsed || isMobileOpen;

  const navSections = [
    {
      group: "Overview",
      items: [
        { name: "Home", key: "home", icon: Home },
      ],
    },
    {
      group: "Cash & Spend",
      items: [
        { name: "Assets", key: "assets", icon: WalletCards },
        { name: "Spending", key: "spending", icon: CreditCard },
        { name: "Transactions", key: "transactions", icon: ArrowLeftRight },
        { name: "Recurring", key: "recurring", icon: Repeat },
      ],
    },
    {
      group: "Wealth & Planning",
      items: [
        { name: "Budget", key: "budget", icon: PieChart },
        { name: "Goals", key: "goals", icon: Target },
        { name: "Investments", key: "investments", icon: TrendingUp },
        { name: "Holdings", key: "holdings", icon: Briefcase },
        { name: "Equity", key: "equity", icon: Scale },
      ],
    },
    {
      group: "Markets & Credit",
      items: [
        { name: "Market Watch", key: "market-watch", icon: Activity },
        { name: "Credit Score", key: "credit-score", icon: ShieldCheck },
        { name: "Reports", key: "reports", icon: FileText },
      ],
    },
  ];

  return (
    <>
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <Link to="/" className="sidebar-brand-link" onClick={() => setIsMobileOpen(false)}>
            <h2>Worth<span>Me</span></h2>
          </Link>
          <Link to="/" className="sidebar-brand-link-collapsed" title="WorthMe" onClick={() => setIsMobileOpen(false)}>
            <span className="brand-monogram">W</span>
          </Link>
        </div>

        <button
          type="button"
          className="collapse-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        <button
          type="button"
          className="mobile-nav-toggle"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileOpen}
          aria-controls="dashboard-primary-navigation"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <nav className="sidebar-nav" id="dashboard-primary-navigation" aria-label="Dashboard navigation">
        {navSections.map((sec, idx) => (
          <div key={idx} className="sidebar-group">
            {showLabels && (
              <span className="sidebar-group-label">{sec.group}</span>
            )}
            <ul className="menu">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      className={`menu-item ${isActive ? "active" : ""}`}
                      aria-label={item.name}
                      onClick={() => {
                        setActiveSection(item.key);
                        setIsMobileOpen(false);
                      }}
                      title={item.name}
                    >
                      <Icon size={18} className="menu-icon-svg" />
                      {showLabels && <span>{item.name}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        <Link
          to="/banks"
          className="sidebar-footer-link"
          title="Accounts"
          onClick={() => setIsMobileOpen(false)}
        >
          <Landmark size={18} />
          {showLabels && <span>Accounts</span>}
        </Link>

        <div className="sidebar-user-block">
          <Link
            to="/profile"
            className="sidebar-user-info"
            title={user?.email || "Profile"}
            onClick={() => setIsMobileOpen(false)}
          >
            <div className="sidebar-avatar">{initials}</div>
            {showLabels && (
              <div className="sidebar-user-text">
                <span className="sidebar-user-name">
                  {user?.first_name || user?.name || "Account"}
                </span>
                <small className="sidebar-user-email">
                  {user?.email || "View profile"}
                </small>
              </div>
            )}
          </Link>

          {showLabels ? (
            <button
              type="button"
              className="sidebar-logout-btn"
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-logout-btn-collapsed"
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
    {isMobileOpen && (
      <button
        type="button"
        className="dashboard-nav-backdrop"
        aria-label="Close navigation"
        onClick={() => setIsMobileOpen(false)}
      />
    )}
    </>
  );
};

export default Sidebar;
