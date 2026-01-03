import React, { useState, useContext } from "react";
import "../styles/auth.css";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../context/userContext";

const Login = () => {
  const navigate = useNavigate();
  // Destructure setUser so we can update the global app state
  const { setUser } = useContext(UserContext); 
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      user: {
        email: formData.email,
        password: formData.password,
      }
    };

    try {
      const res = await fetch("http://localhost:4000/api/users/log_in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        // Allows the browser to handle the Phoenix session cookie
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "Login failed");
        setIsSubmitting(false);
        return;
      }

      // 1. UPDATE GLOBAL STATE: This is what allows ProtectedRoute to let you in
      setUser(result.user);

      // 2. OPTIONAL: Backup storage for page refreshes
      localStorage.setItem("user", JSON.stringify(result.user));

      // 3. NAVIGATE: Send the user to the dashboard
      navigate("/dashboard");
      
    } catch (error) {
      console.error(error);
      setError("Server connection failed. Is the backend running?");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="authbox">
      <h2>Login</h2>

      {error && <div className="error-banner" style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="inputs">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="password">Password:</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="ctas">
          <div className="action">
            <span>Don’t have an account?</span>
            <Link to="/register">Register Now</Link>
          </div>
          <button type="submit" className="authBtn" disabled={isSubmitting}>
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;