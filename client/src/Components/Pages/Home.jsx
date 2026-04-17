import React from "react";
import banks from "../../banks/banks";

import "../styles/home.css";
import Vid from "../../images/track.mp4";
const Home = () => {
  return (
    <div className="homepage">
      
      <div className="box">
        <div className="left">
          {/* Hero */}
          <section className="hero">
            <div className="hero-content">
              <h1>
                Track Your <span>Net Worth</span> With Ease
              </h1>
              <p>
                Upload your bank statements, monitor investments, and stay in
                control of your financial growth.
              </p>
              <div className="cta-buttons">
                <button className="btn-primary">Get Started</button>
                <button className="btn-secondary">Learn More</button>
              </div>
            </div>
          </section>
        </div>

        <div className="right">
          <video src={Vid} autoPlay loop muted  className="right-vid"/>
        </div>
      </div>
      {/* Bank Slider */}
      <section className="slider-section">
        <p className="slider-title">Supported by leading banks & wallets</p>
        <div className="slider">
          <div className="slide-track">
            {[...banks, ...banks].map((bank, idx) => (
              <div key={idx} className="slide">
                <img src={bank.logo} alt={bank.name} />
                <p>{bank.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      {/* <section className="cta-section">
        <h2>Take Control of Your Wealth Today</h2>
        <button className="btn-primary">Sign Up Free</button>
      </section> */}
    </div>
  );
};

export default Home;
