import React from 'react';
import '../styles/About.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-hero">
        <h1>About WorthMe</h1>
        <p className="about-tagline">
          Your personal wealth tracker, built for the modern Kenyan digital economy.
        </p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>What We Do</h2>
          <p>
            WorthMe helps you track your wealth across multiple mobile money platforms 
            and banking institutions. We parse your M-Pesa and Airtel Money statements 
            to give you a consolidated view of your financial standing.
          </p>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <div className="about-steps">
            <div className="step">
              <span className="step-number">1</span>
              <h3>Upload Statements</h3>
              <p>Simply upload your M-Pesa or Airtel Money PDF statements</p>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <h3>We Parse Data</h3>
              <p>Our system automatically extracts transaction data and balances</p>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <h3>View Insights</h3>
              <p>See your total worth, track transactions, and monitor spending</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Privacy First</h2>
          <p>
            Your financial data stays in your browser session. We don't store your 
            statements on our servers. Your data, your control.
          </p>
        </section>
      </div>
    </div>
  );
};

export default About;
