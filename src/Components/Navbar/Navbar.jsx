import React, { useState, useEffect } from "react";
import "./navbar.css";
import { Link, useNavigate } from "react-router-dom";
import { IoMenu, IoClose } from "react-icons/io5";
import axios from "axios";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return setUser(null);

        const res = await axios.get("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          
        });

        setUser(res.data.user);
      } catch (err) {
        console.error("Not logged in:", err.response?.data || err.message);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // Logout handler
  const handleLogout = async () => {
    try {
    const token = localStorage.getItem("token");

      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
        
      );
      localStorage.removeItem("token");
      setUser(null);
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err.response?.data || err.message);
    }
  };

  // Get Name Initials
  const getInitials = () => {
    if (!user) return "";
    const first = user.first_name || "";
    const last = user.second_name || user.last_name || "";
    return (first[0] || "").toUpperCase() + (last[0] || "").toUpperCase();
  };

  return (
    <header className="navbar">
      {/* Logo */}
      <div className="logo">
        Worth<span>Me</span>
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
        {user ? (
          <>
            <div className="profile-circle">{getInitials()}</div>
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
          {user ? (
            <>
              <div className="profile-circle">{getInitials()}</div>
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
        </div>
      </div>
    </header>
  );
};

export default Navbar;
