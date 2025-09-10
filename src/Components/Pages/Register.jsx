import React, { useState } from "react";
import LightRays from "../../ReactBits/Bground";
import "../styles/auth.css";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    Fname: "",
    Lname: "",
    email: "",
    password: "",
    phone: "",
  });

  // handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.message || "Registration failed");
        return;
      }

      // ✅ Store token in localStorage (same as Login)
      if (result.token) {
        localStorage.setItem("token", result.token);
        alert("Registration successful!");
        navigate("/dashboard"); // Go straight to dashboard after signup
      } else {
        alert("User registered, please login.");
        navigate("/login");
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong!");
    }
  };

  return (
    <>
      
      <div className="authbox">
        <h2>Register Today</h2>
        <form onSubmit={handleSubmit}>
          <div className="inputs">
            <label htmlFor="Fname">First Name:</label>
            <input
              type="text"
              name="Fname"
              placeholder="First Name"
              value={formData.Fname}
              onChange={handleChange}
              required
            />

            <label htmlFor="Lname">Last Name:</label>
            <input
              type="text"
              name="Lname"
              placeholder="Last Name"
              value={formData.Lname}
              onChange={handleChange}
              required
            />

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

            <label htmlFor="phone">Phone Number:</label>
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="ctas">
            <div className="action">
              <span>Already have an account?</span>
              <Link to="/login">Login Now</Link>
            </div>
            <button type="submit" className="authBtn">
              Register
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Register;
