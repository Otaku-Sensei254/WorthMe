import React from "react";
import { ShieldCheck, CheckCircle2, TrendingUp } from "lucide-react";
import "../../styles/dashboard.css";

const CreditScoreView = () => {
  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Credit Health & Borrowing Standing</h3>
          <p>Credit bureau risk profile, mobile loan limits, and debt-to-income benchmarks.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Estimated CRB Rating</span>
          <strong className="text-emerald">Good (730 / 850)</strong>
          <small>Metropol / TransUnion profile</small>
        </div>
        <div className="metric-box">
          <span>Mobile Overdraft Utilization</span>
          <strong className="text-white">0% (Nil Balance)</strong>
          <small>Fuliza / M-Shwari / KCB M-Pesa</small>
        </div>
        <div className="metric-box">
          <span>Debt-to-Income (DTI)</span>
          <strong className="text-emerald">Healthy (&lt; 25%)</strong>
          <small>Conservative borrowing ratio</small>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="view-panel">
          <h4>Credit Standing Breakdown</h4>
          <p className="panel-desc">Key factors influencing your credit assessment.</p>

          <div className="credit-factors-list">
            <div className="credit-factor-row">
              <div className="factor-header">
                <CheckCircle2 size={18} className="text-emerald" />
                <span>On-Time Payment History</span>
              </div>
              <strong className="text-emerald">Spotless (100%)</strong>
            </div>

            <div className="credit-factor-row">
              <div className="factor-header">
                <CheckCircle2 size={18} className="text-emerald" />
                <span>Fuliza Overdraft Settlement</span>
              </div>
              <strong className="text-emerald">Cleared Promptly</strong>
            </div>

            <div className="credit-factor-row">
              <div className="factor-header">
                <CheckCircle2 size={18} className="text-emerald" />
                <span>Credit Inquiries (Last 6 Mos)</span>
              </div>
              <strong className="text-white">1 Inquiry</strong>
            </div>

            <div className="credit-factor-row">
              <div className="factor-header">
                <CheckCircle2 size={18} className="text-emerald" />
                <span>CRB Listing Status</span>
              </div>
              <strong className="text-emerald">Clean / Positive Listing</strong>
            </div>
          </div>
        </div>

        <div className="view-panel">
          <h4>Borrowing Capacity Simulator</h4>
          <p className="panel-desc">Estimated borrowing power based on verified statement income.</p>
          <div className="insight-cards-stack">
            <div className="insight-card">
              <TrendingUp size={20} className="text-champagne" />
              <div>
                <strong>Commercial Bank Personal Facility</strong>
                <p>Eligible for pre-approved unsecured facilities up to Ksh 1.2M based on regular turnover.</p>
              </div>
            </div>
            <div className="insight-card">
              <ShieldCheck size={20} className="text-emerald" />
              <div>
                <strong>SACCO Asset Financing</strong>
                <p>Cooperative borrowing multiplier allows up to 3x–4x your non-withdrawable deposit savings.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditScoreView;
