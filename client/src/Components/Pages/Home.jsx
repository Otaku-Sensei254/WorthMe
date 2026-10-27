import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowDownUp, BarChart3, FileUp, Landmark, PieChart, Search, TrendingUp, WalletCards } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { UserContext } from "../../context/userContext";
import banks from "../../banks/banks";

import "../styles/home.css";
import Vid from "../../images/track.mp4";

const sectionReveal = {
  hidden: { opacity: 0, x: 28, scale: 0.99 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 68, damping: 20 },
  },
};

const featureListReveal = {
  hidden: {},
  visible: {
    transition: { when: "beforeChildren", staggerChildren: 0.12 },
  },
};

const featureCardReveal = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 105, damping: 18 } },
};

const copyReveal = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: [0.2, 0.65, 0.3, 1] } },
};

const trackingCardReveal = {
  hidden: { opacity: 0, x: 34, scale: 0.97 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 72, damping: 19 } },
};

const noMotionVariants = {
  hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
  visible: { opacity: 1, x: 0, y: 0, scale: 1, transition: { duration: 0 } },
};

const Home = () => {
  const { user } = useContext(UserContext);
  const shouldReduceMotion = useReducedMotion();
  const revealInitial = shouldReduceMotion ? false : "hidden";
  const revealViewport = { once: true, amount: 0.18 };

  return (
    <div className="homepage">
      <div className="box">
        <div className="left">
          {/* Hero */}
          <section className="hero">
            <div className="hero-content">
              <h1>
                All your wealth. <span>One calm place.</span>
              </h1>
              <p>
                Bring balances and activity from M-Pesa, Airtel Money, and selected bank statements into one clear view.
              </p>
              <div className="cta-buttons">
                <Link to={user ? "/dashboard" : "/register"} className="btn-primary">
                  {user ? "Open dashboard" : "Get Started"}
                </Link>
                <a href="#how-it-works" className="btn-secondary">How it works</a>
              </div>
            </div>
          </section>
        </div>

        <div className="right">
          <video src={Vid} autoPlay loop muted playsInline className="right-vid" />
        </div>
      </div>
      <motion.section
        className="home-how"
        id="how-it-works"
        aria-labelledby="home-how-title"
        variants={shouldReduceMotion ? noMotionVariants : featureListReveal}
        initial={revealInitial}
        whileInView="visible"
        viewport={revealViewport}
      >
        <motion.div className="home-section-heading" variants={shouldReduceMotion ? noMotionVariants : copyReveal}>
          <span className="home-eyebrow">One view across your finances</span>
          <h2 id="home-how-title">Your financial picture, brought together.</h2>
          <p>See day-to-day accounts, spending patterns and longer-term plans in one place.</p>
        </motion.div>
        <div className="home-feature-grid">
          <motion.article className="home-feature-card" variants={shouldReduceMotion ? noMotionVariants : featureCardReveal}>
            <span className="home-feature-icon"><WalletCards size={19} /></span>
            <span className="home-feature-step">ACCOUNTS</span>
            <h3>Bring accounts together</h3>
            <p>Import supported bank and mobile money statements to see balances and activity together.</p>
          </motion.article>
          <motion.article className="home-feature-card" variants={shouldReduceMotion ? noMotionVariants : featureCardReveal}>
            <span className="home-feature-icon"><ArrowDownUp size={19} /></span>
            <span className="home-feature-step">CASH FLOW</span>
            <h3>Understand the movement</h3>
            <p>Review transactions, follow spending and see how money moves across your accounts.</p>
          </motion.article>
          <motion.article className="home-feature-card" variants={shouldReduceMotion ? noMotionVariants : featureCardReveal}>
            <span className="home-feature-icon"><PieChart size={19} /></span>
            <span className="home-feature-step">PLANNING</span>
            <h3>Keep sight of your goals</h3>
            <p>Bring budgets, savings goals and investment records into the same financial view.</p>
          </motion.article>
        </div>
      </motion.section>

      <motion.section
        className="home-providers"
        aria-labelledby="home-providers-title"
        variants={shouldReduceMotion ? noMotionVariants : sectionReveal}
        initial={revealInitial}
        whileInView="visible"
        viewport={revealViewport}
      >
        <div className="home-providers-heading">
          <div>
            <span className="home-eyebrow">Made for the accounts you use</span>
            <h2 id="home-providers-title">Supported providers</h2>
          </div>
          <Link to={user ? "/banks" : "/register"} className="home-text-link">
            {user ? "View accounts" : "Get started"}<span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="provider-carousel" role="region" aria-label="Supported banks and mobile money providers">
          <div className="provider-carousel-track">
            {[false, true].map((isDuplicate) => (
              <div className="provider-carousel-group" key={isDuplicate ? "duplicate" : "providers"} aria-hidden={isDuplicate}>
                {banks.map((bank) => (
                  <div className="provider-slide" key={`${isDuplicate ? "copy-" : ""}${bank.id}`}>
                    <img src={bank.logo} alt={isDuplicate ? "" : bank.name} loading="lazy" />
                    <span>{bank.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="provider-note"><Landmark size={14} /> Statement import support varies by provider.</p>
      </motion.section>

      <motion.section
        className="home-tracking"
        aria-labelledby="home-tracking-title"
        variants={shouldReduceMotion ? noMotionVariants : sectionReveal}
        initial={revealInitial}
        whileInView="visible"
        viewport={revealViewport}
      >
        <motion.div className="tracking-copy" variants={shouldReduceMotion ? noMotionVariants : copyReveal}>
          <span className="home-eyebrow">Beyond everyday spending</span>
          <h2 id="home-tracking-title">Keep an eye on markets and investment growth.</h2>
          <p>Follow market references and review your investment records alongside your wider financial picture.</p>
          <Link to={user ? "/dashboard" : "/register"} className="btn-primary">
            {user ? "Open dashboard" : "Start with WorthMe"}
          </Link>
        </motion.div>
        <motion.div
          className="tracking-preview"
          role="img"
          aria-label="Illustration of market and investment tracking"
          variants={shouldReduceMotion ? noMotionVariants : trackingCardReveal}
        >
          <div className="tracking-preview-top">
            <span className="tracking-preview-mark"><BarChart3 size={16} /></span>
            <div><span>OVERVIEW</span><strong>Markets &amp; investments</strong></div>
            <span className="tracking-preview-period">VIEW</span>
          </div>
          <div className="tracking-chart-label"><span>Investment growth</span><span>Illustrative view</span></div>
          <div className="tracking-chart" aria-hidden="true">
            <div className="tracking-chart-grid"><i /><i /><i /></div>
            <svg viewBox="0 0 520 150" preserveAspectRatio="none">
              <defs><linearGradient id="tracking-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#bba77c" stopOpacity=".24" /><stop offset="100%" stopColor="#bba77c" stopOpacity="0" /></linearGradient></defs>
              <path className="tracking-chart-area" d="M0 121 C34 112 40 91 79 98 S127 116 162 86 S207 95 238 71 S285 88 316 62 S360 80 390 50 S430 68 459 35 S495 45 520 18 L520 150 L0 150Z" />
              <path className="tracking-chart-line" d="M0 121 C34 112 40 91 79 98 S127 116 162 86 S207 95 238 71 S285 88 316 62 S360 80 390 50 S430 68 459 35 S495 45 520 18" />
            </svg>
          </div>
          <div className="tracking-preview-bottom">
            <span><TrendingUp size={15} /> Investment records</span>
            <span><Search size={15} /> Market watch</span>
            <span><FileUp size={15} /> Holdings</span>
          </div>
        </motion.div>
      </motion.section>
    </div>
  );
};

export default Home;
