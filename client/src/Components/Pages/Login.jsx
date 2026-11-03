import React, { useState, useContext, useEffect } from "react";
import "../styles/auth.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { UserContext } from "../../context/userContext";
import GoogleAuthButton from "../Auth/GoogleAuthButton";
import AuthLayout from "../Auth/AuthLayout";
import { getNeonAuthUrl, startGoogleSignIn } from "../../auth/neonAuth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Destructure setUser so we can update the global app state
  const { setUser } = useContext(UserContext);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [neonAuthEnabled, setNeonAuthEnabled] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
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

  useEffect(() => {
    if (searchParams.get("auth_error") === "google") {
      setError("Google sign-in could not be completed. Please try again.");
    }
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleSubmitting(true);
    setError(null);
    try {
      await startGoogleSignIn();
    } catch (signInError) {
      setError(signInError.message || "Google sign-in is unavailable right now.");
      setIsGoogleSubmitting(false);
    }
  };

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
      const res = await fetch(`${API_BASE}/api/users/log_in`, {
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
    <AuthLayout
      title="Your finances, in one place."
      description="Bring everyday accounts and long-term plans into a clearer view."
      switchPrompt="New to WorthMe?"
      switchLabel="Create account"
      switchTo="/register"
    >
    <div className="authbox">
      <div className="auth-heading">
        <span className="auth-eyebrow">Welcome back</span>
        <h2>Sign in</h2>
        <p>Use your email and password to continue.</p>
      </div>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <div className="auth-social">
        <GoogleAuthButton enabled={neonAuthEnabled && !isGoogleSubmitting} onClick={handleGoogleSignIn}>
          {isGoogleSubmitting ? "Connecting to Google…" : "Continue with Google"}
        </GoogleAuthButton>
        <div className="auth-divider"><span>or continue with email</span></div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="inputs auth-fields auth-login-fields">
          <div className="auth-field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="login-password">Password</label>
            <div className="auth-password-control">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Enter your password"
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
          </div>
        </div>

        <div className="ctas">
          <button type="submit" className="authBtn auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>
    </div>
    </AuthLayout>
  );
};

export default Login;
