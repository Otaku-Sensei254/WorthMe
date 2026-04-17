import React, { useState, useContext } from "react";
import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { IoMenu, IoClose } from "react-icons/io5";
import axios from "axios";
import { UserContext } from "../../context/userContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

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

  // Get Name Initials from email
  const getInitials = () => {
    if (!user) return "";
    // The user object from the backend only has email
    const email = user.email || "";
    return (email[0] || "").toUpperCase();
  };

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="logo">
        <Link to="/">
          Worth<span>Me</span>
        </Link>
      </div>

      {/* Hamburger and Close Icon */}
      <div className="menu-icon" onClick={toggleMenu}>
        {isOpen ? <IoClose size={30} /> : <IoMenu size={30} />}
      </div>

      {/* Desktop Nav */}
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/features">Features</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/banks">Banks</Link>
      </nav>

      {/* Desktop Auth / User */}
      <div className="auth-buttons">
        {!loading && (
          <>
            {user ? (
              <>
                <Link to="/profile" className="profile-link" aria-label="Open profile">
                  <div className="profile-circle">{getInitials()}</div>
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

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isOpen ? "open" : ""}`}>
        <nav>
          <Link to="/" onClick={toggleMenu}>
            Home
          </Link>
          <Link to="/about" onClick={toggleMenu}>
            About
          </Link>
          <Link to="/features" onClick={toggleMenu}>
            Features
          </Link>
          <Link to="/dashboard" onClick={toggleMenu}>
            Dashboard
          </Link>
          <Link to="/banks" onClick={toggleMenu}>
            Banks
          </Link>
        </nav>
        <div className="auth-buttons-mobile">
          {!loading && (
            <>
              {user ? (
                <>
                  <Link to="/profile" className="profile-link" onClick={toggleMenu}>
                    <div className="profile-circle">{getInitials()}</div>
                  </Link>
                  <button
                    className="btn-1"
                    onClick={() => {
                      toggleMenu();
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-1" onClick={toggleMenu}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-2" onClick={toggleMenu}>
                    Get Started
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
