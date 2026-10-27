import React from "react";
import { Link } from "react-router-dom";

const AuthLayout = ({ title, description, switchPrompt, switchLabel, switchTo, children }) => (
  <main className="auth-page">
    <div className="auth-shell">
      <aside className="auth-intro">
        <Link to="/" className="auth-wordmark">Worth<span>Me</span></Link>
        <div className="auth-intro-copy">
          <span>PERSONAL FINANCE, IN CONTEXT</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="auth-intro-footer">ACCOUNTS <i /> CASH FLOW <i /> PLANNING</div>
      </aside>
      <section className="auth-form-side" aria-label="Account access">
        <div className="auth-switch-top">
          <span>{switchPrompt}</span>
          <Link to={switchTo}>{switchLabel}</Link>
        </div>
        {children}
      </section>
    </div>
  </main>
);

export default AuthLayout;
