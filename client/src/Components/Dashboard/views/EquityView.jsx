import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney, normalizeMoney } from "../../../utils/money";
import { Scale, ShieldCheck } from "lucide-react";
import "../../styles/dashboard.css";

const EquityView = () => {
  const { totalWorth } = useContext(WealthContext);
  const assetsTotal = normalizeMoney(totalWorth);
  const liabilitiesTotal = 0.00; // Zero liabilities baseline
  const netEquity = assetsTotal - liabilitiesTotal;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Net Equity & Balance Sheet</h3>
          <p>Total real balance sheet equity calculated as Assets minus Liabilities.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Net Equity Value</span>
          <strong className="text-champagne">Ksh {formatMoney(netEquity)}</strong>
          <small>Net solvency balance</small>
        </div>
        <div className="metric-box">
          <span>Total Tangible & Liquid Assets</span>
          <strong className="text-emerald">Ksh {formatMoney(assetsTotal)}</strong>
          <small>Aggregated across statement wallets</small>
        </div>
        <div className="metric-box">
          <span>Recorded Debt & Liabilities</span>
          <strong className="text-white">Ksh {formatMoney(liabilitiesTotal)}</strong>
          <small>Zero active recorded debt</small>
        </div>
      </div>

      <div className="two-column-grid">
        <div className="view-panel">
          <h4>Assets vs Liabilities Ledger</h4>
          <p className="panel-desc">Summary of positive capital vs outstanding credit obligations.</p>

          <div className="equity-summary-table">
            <div className="equity-row">
              <span>Tracked Liquid Assets (Wallets & Checking)</span>
              <strong className="text-emerald">+ Ksh {formatMoney(assetsTotal)}</strong>
            </div>
            <div className="equity-row">
              <span>Short-term Mobile Debt (Fuliza / M-Shwari)</span>
              <strong className="text-muted">- Ksh 0.00</strong>
            </div>
            <div className="equity-row">
              <span>Commercial Bank Facilities / Personal Loans</span>
              <strong className="text-muted">- Ksh 0.00</strong>
            </div>
            <div className="equity-row total-row">
              <span>Total Balance Sheet Equity</span>
              <strong className="text-champagne">Ksh {formatMoney(netEquity)}</strong>
            </div>
          </div>
        </div>

        <div className="view-panel">
          <h4>Capital Solvency Metric</h4>
          <p className="panel-desc">Financial resilience and leverage score.</p>
          <div className="insight-cards-stack">
            <div className="insight-card">
              <Scale size={20} className="text-emerald" />
              <div>
                <strong>Debt-to-Equity: 0.00x</strong>
                <p>100% equity-funded capital. No debt drag or servicing costs eroding compound interest.</p>
              </div>
            </div>
            <div className="insight-card">
              <ShieldCheck size={20} className="text-champagne" />
              <div>
                <strong>Solvency Buffer</strong>
                <p>Liquid assets provide immediate runway without relying on emergency credit facilities.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquityView;
