import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { UserContext } from "../../context/userContext";
import "./Footer.css";

const Footer = () => {
  const { user } = useContext(UserContext);
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const handleSubscribe = (event) => {
    event.preventDefault();
    setSubscribeMessage("Email updates aren’t connected yet.");
  };

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link to="/" className="site-footer-wordmark">Worth<span>Me</span></Link>
          <p>A clearer view of your money, from everyday accounts to long-term plans.</p>
        </div>

        <nav className="site-footer-nav" aria-label="Footer navigation">
          <div className="site-footer-nav-group">
            <span>Explore</span>
            <Link to="/">Home</Link>
            <a href="/#how-it-works">How it works</a>
          </div>
          <div className="site-footer-nav-group">
            <span>Your space</span>
            {user ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/banks">Accounts</Link>
              </>
            ) : (
              <>
                <Link to="/login">Sign in</Link>
                <Link to="/register">Create an account</Link>
              </>
            )}
          </div>
        </nav>

        <section className="site-footer-newsletter" aria-labelledby="footer-newsletter-title">
          <div>
            <h2 id="footer-newsletter-title">Get WorthMe updates</h2>
            <p>Occasional notes when something useful changes.</p>
          </div>
          <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
            <label className="visually-hidden" htmlFor="footer-email">Email address</label>
            <input id="footer-email" type="email" placeholder="Email address" required />
            <button type="submit">Subscribe</button>
          </form>
          <p className="footer-newsletter-message" aria-live="polite">{subscribeMessage}</p>
        </section>
      </div>

      <div className="site-footer-bottom">
        <span>© {new Date().getFullYear()} WorthMe</span>
        <span className="site-footer-credit">Powered By <strong>WebWorks - D-Huhu Tech Labs</strong></span>
        <a href="#root" className="site-footer-top">Back to top <ArrowUpRight size={14} /></a>
      </div>
    </footer>
  );
};

export default Footer;
