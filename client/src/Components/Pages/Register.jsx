import React, { useState, useEffect } from "react";
import "../styles/auth.css";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import GoogleAuthButton from "../Auth/GoogleAuthButton";
import AuthLayout from "../Auth/AuthLayout";
import { getNeonAuthUrl, startGoogleSignIn } from "../../auth/neonAuth";
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

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
  const [neonAuthEnabled, setNeonAuthEnabled] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const checkNeonConfig = async () => {
      try {
        await getNeonAuthUrl();
        setNeonAuthEnabled(true);
      } catch {
        setNeonAuthEnabled(false);
      }
    };
    checkNeonConfig();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setGoogleError("");
    try {
      await startGoogleSignIn();
    } catch (error) {
      setGoogleError(error.message || "Google sign-up is unavailable right now.");
      setIsGoogleSubmitting(false);
    }
  };

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
        phone: formData.phone ? `+254${formData.phone}` : ""
      }
    };

    try {
      // 2. Point to Phoenix port (4000) and the API route we created
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await res.text();
      let result = null;
      try {
        result = responseBody ? JSON.parse(responseBody) : null;
      } catch {
        // Phoenix can return a plain-text debug exception for an unexpected 500.
      }

      if (!res.ok) {
        // 3. Handle Ecto validation errors
        // Phoenix sends errors as: { "errors": { "email": ["has already been taken"] } }
        if (result?.errors) {
          setErrors(result.errors);
        } else {
          console.error(`Registration failed with HTTP ${res.status}.`);
          alert(result?.message || `Registration failed (HTTP ${res.status}). Please try again.`);
        }
        return;
      }

      if (!result) {
        throw new Error("The server returned an unreadable registration response.");
      }

      alert("Registration successful! Please log in.");
      navigate("/login");

    } catch (error) {
      console.error("Registration request failed:", error);
      alert(error.message || "Could not reach the registration service. Please try again.");
    }
  };

  return (
    <AuthLayout
      title="Build a fuller financial picture."
      description="Keep accounts, spending and the plans ahead within reach."
      switchPrompt="Already have an account?"
      switchLabel="Login now"
      switchTo="/login"
    >
    <div className="authbox">
      <div className="auth-heading">
        <span className="auth-eyebrow">Start with a clear picture</span>
        <h2>Create account</h2>
        <p>Set up your details to get started with WorthMe.</p>
      </div>

      <div className="auth-social">
        <GoogleAuthButton enabled={neonAuthEnabled && !isGoogleSubmitting} onClick={handleGoogleSignIn}>
          {isGoogleSubmitting ? "Connecting to Google…" : "Sign up with Google"}
        </GoogleAuthButton>
        <div className="auth-divider"><span>or register with email</span></div>
      </div>
      {googleError && <div className="error-banner" role="alert">{googleError}</div>}

      <form onSubmit={handleSubmit}>
        <div className="inputs auth-fields auth-register-fields">
          <div className="auth-field">
            <label htmlFor="register-first-name">First name</label>
            <input id="register-first-name" type="text" name="Fname" autoComplete="given-name" value={formData.Fname} onChange={handleChange} required />
            {errors.first_name && <span className="error-text">{errors.first_name[0]}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="register-last-name">Last name</label>
            <input id="register-last-name" type="text" name="Lname" autoComplete="family-name" value={formData.Lname} onChange={handleChange} required />
            {errors.last_name && <span className="error-text">{errors.last_name[0]}</span>}
          </div>

          <div className="auth-field">
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" type="email" name="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
            {errors.email && <span className="error-text">{errors.email[0]}</span>}
          </div>

           <div className="auth-field">
            <label htmlFor="register-phone">Phone number</label>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span style={{ padding: "0 8px", fontWeight: 600 }}>+254</span>
              <input id="register-phone" type="tel" name="phone" autoComplete="tel" placeholder="712345678" value={formData.phone} onChange={handleChange} required />
            </div>
            {errors.phone && <span className="error-text">{errors.phone[0]}</span>}
          </div>

          <div className="auth-field auth-field-wide">
            <label htmlFor="register-password">Password</label>
            <div className="auth-password-control">
              <input
                id="register-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password[0]}</span>}
          </div>
        </div>

        <div className="ctas">
          <button type="submit" className="authBtn auth-submit">Create account</button>
        </div>
      </form>
    </div>
    </AuthLayout>
  );
};

export default Register;
