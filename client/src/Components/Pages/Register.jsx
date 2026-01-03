import React, { useState } from "react";
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

  // NEW: State to store backend validation errors
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear the error for this field when the user starts typing again
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); // Reset errors on new attempt

    // 1. Map Frontend fields to Elixir Snake_Case fields
    const payload = {
      user: {
        email: formData.email,
        password: formData.password,
        first_name: formData.Fname,
        last_name: formData.Lname,
        phone: formData.phone
      }
    };

    try {
      // 2. Point to Phoenix port (4000) and the API route we created
      const res = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        // 3. Handle Ecto validation errors
        // Phoenix sends errors as: { "errors": { "email": ["has already been taken"] } }
        if (result.errors) {
          setErrors(result.errors);
        } else {
          alert(result.message || "Registration failed");
        }
        return;
      }

      alert("Registration successful! Please log in.");
      navigate("/login");

    } catch (error) {
      console.error("Connection Error:", error);
      alert("Backend server is not running or CORS is blocking the request.");
    }
  };

  return (
    <div className="authbox">
      <h2>Register Today</h2>
      <form onSubmit={handleSubmit}>
        <div className="inputs">
          <label>First Name:</label>
          <input type="text" name="Fname" value={formData.Fname} onChange={handleChange} required />
          {/* Display specific error if it exists */}
          {errors.first_name && <span className="error-text">First Name {errors.first_name[0]}</span>}

          <label>Last Name:</label>
          <input type="text" name="Lname" value={formData.Lname} onChange={handleChange} required />
          {errors.last_name && <span className="error-text">Last Name {errors.last_name[0]}</span>}

          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          {errors.email && <span className="error-text">Email {errors.email[0]}</span>}

          <label>Password:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
          {errors.password && <span className="error-text">Password {errors.password[0]}</span>}

          <label>Phone Number:</label>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required />
          {errors.phone && <span className="error-text">Phone {errors.phone[0]}</span>}
        </div>

        <div className="ctas">
          <div className="action">
            <span>Already have an account?</span>
            <Link to="/login">Login Now</Link>
          </div>
          <button type="submit" className="authBtn">Register</button>
        </div>
      </form>
    </div>
  );
};

export default Register;