import React, { useContext } from "react";
import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../../context/userContext";
import StaggeredMenu from "./StaggeredMenu";

const Navbar = () => {
  const { user, loading, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = async () => {
    try {
      await axios.delete("http://localhost:4000/api/users/log_out", {
        withCredentials: true,
      });
      fetchUser();
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
    }
  };

  const getFirstName = () => {
    const storedName = user?.first_name || user?.name;
    if (storedName?.trim()) return storedName.trim().split(/\s+/)[0];
    return user?.email?.split("@")[0] || "Account";
  };

  const mobileMenuItems = loading
    ? []
    : user
      ? [
          { label: "Dashboard", ariaLabel: "Open your dashboard", link: "/dashboard" },
          { label: "Accounts", ariaLabel: "View your accounts", link: "/banks" },
          { label: "Profile", ariaLabel: "Open your profile", link: "/profile" },
          { label: "Log out", ariaLabel: "Log out of WorthMe", onClick: handleLogout },
        ]
      : [
          { label: "Sign in", ariaLabel: "Sign in to WorthMe", link: "/login" },
          { label: "Create account", ariaLabel: "Create a WorthMe account", link: "/register" },
        ];

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="logo">
        <Link to="/">
          Worth<span>Me</span>
        </Link>
      </div>

      {/* Desktop Nav */}
      <nav className="nav-links">
        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Link to="/banks">Accounts</Link>}
      </nav>

      {/* Desktop Auth / User */}
      <div className="auth-buttons">
        {!loading && (
          <>
            {user ? (
              <>
                <Link to="/profile" className="profile-link" aria-label="Open profile">
                  <span className="profile-name">{getFirstName()}</span>
                </Link>
                <button className="btn-1" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-1">
                  Sign In
                </Link>
                <Link to="/register" className="btn-2">
                  Get Started
                </Link>
              </>
            )}
          </>
        )}
      </div>

      <div className="navbar-mobile-menu" aria-label="Mobile navigation">
        <StaggeredMenu
          position="right"
          items={mobileMenuItems}
          socialItems={[]}
          displaySocials={false}
          displayItemNumbering
          menuButtonColor="#f7f5ef"
          openMenuButtonColor="#f7f5ef"
          changeMenuColorOnOpen={false}
          colors={["#b99b62", "#1a1b17"]}
          logoUrl=""
          accentColor="#b99b62"
          className="worthme-staggered-menu"
        />
      </div>
    </header>
  );
};

export default Navbar;
