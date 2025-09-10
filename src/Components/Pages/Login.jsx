import React, { useState } from "react";
//import LightRays from "../../ReactBits/Bground";
import "../styles/auth.css";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Login failed");
        return;
      }

      // Store token in localStorage
      localStorage.setItem("token", result.token);

      alert("Login successful!");
      navigate("/dashboard"); // redirect to dashboard or home
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <>
      
      <div className="authbox">
        <h2>Login</h2>
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
            <button type="submit" className="authBtn">
              Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Login;
