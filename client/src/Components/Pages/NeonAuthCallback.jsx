import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../Auth/AuthLayout";
import { UserContext } from "../../context/userContext";
import { getAuthClient } from "../../lib/auth";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const NeonAuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, fetchUser } = useContext(UserContext);
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const completeSignIn = async () => {
      try {
        const authClient = await getAuthClient();
        const session = await authClient.getSession();

        if (!session?.data?.session?.token || !session?.data?.user) {
          throw new Error("Neon Auth did not find an active session. Please try again and allow cookies for the Neon Auth domain if your browser asks.");
        }

        const token = session.data.session.token;

        const response = await fetch(`${API_BASE}/api/auth/neon/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify({ token }),
        });
        const result = await response.json();
        if (!response.ok || !result?.user) {
          throw new Error(result.error || "Could not finish signing in to WorthMe.");
        }

        setUser(result.user);
        localStorage.setItem("user", JSON.stringify(result.user));
        await fetchUser();
        navigate("/dashboard", { replace: true });
      } catch (callbackError) {
        setError(callbackError.message || "Google sign-in failed. Please try again.");
      }
    };

    completeSignIn();
  }, [fetchUser, navigate, setUser]);

  return (
    <AuthLayout
      title={error ? "We couldn't sign you in." : "Just a moment."}
      description={error ? "Your Google account is safe. Try again to continue to WorthMe." : "We’re confirming your sign-in and preparing your WorthMe account."}
      switchPrompt="Already have an account?"
      switchLabel="Sign in"
      switchTo="/login"
    >
      <div className="authbox neon-callback-state" aria-live="polite">
        <span className="auth-eyebrow">GOOGLE SIGN-IN</span>
        <h2>{error ? "Sign-in was not completed" : "Signing you in"}</h2>
        {error ? (
          <>
            <p className="error-banner" role="alert">{error}</p>
            <Link className="authBtn auth-submit neon-callback-link" to="/login">Back to sign in</Link>
          </>
        ) : <p>Connecting your account…</p>}
      </div>
    </AuthLayout>
  );
};

export default NeonAuthCallback;
