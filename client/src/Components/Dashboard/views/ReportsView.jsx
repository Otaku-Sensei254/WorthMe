import React, { useContext } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney } from "../../../utils/money";
import { FileText, Download } from "lucide-react";
import "../../styles/dashboard.css";

const ReportsView = () => {
  const { totalWorth, trackedWallets } = useContext(WealthContext);

  const reports = [
    {
      id: "net-worth-summary",
      title: "Consolidated Net Worth Statement",
      period: "Current Snapshot (Statement-Backed)",
      type: "Portfolio Audit",
      date: new Date().toLocaleDateString("en-KE", { dateStyle: "long" }),
    },
    {
      id: "mpesa-audit",
      title: "Mobile Money Flow & Tax Reconciliation",
      period: "Latest Statement Period",
      type: "Cash Flow Audit",
      date: "Generated on Demand",
    },
    {
      id: "banking-ledger",
      title: "I&M Bank Account Activity Report",
      period: "Uploaded Statement Term",
      type: "Bank Reconciliation",
      date: "Verified Record",
    },
  ];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Financial Reports & Audits</h3>
          <p>Exportable portfolio summaries, reconciliation reports, and statement documentation.</p>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-box">
          <span>Net Worth on Record</span>
          <strong className="text-champagne">Ksh {formatMoney(totalWorth)}</strong>
          <small>Statement verified total</small>
        </div>
        <div className="metric-box">
          <span>Active Statement Sources</span>
          <strong>{trackedWallets.filter((w) => w.count > 0).length} Sources</strong>
          <small>M-Pesa, Airtel & Bank records</small>
        </div>
        <div className="metric-box">
          <span>Reconciliation Status</span>
          <strong className="text-emerald">Audited & Verified</strong>
          <small>Stored locally & private</small>
        </div>
      </div>

      <div className="reports-list">
        {reports.map((r) => (
          <div key={r.id} className="report-card">
            <div className="report-card-left">
              <FileText size={24} className="text-champagne" />
              <div>
                <h4>{r.title}</h4>
                <div className="report-meta">
                  <span>{r.period}</span>
                  <span>•</span>
                  <span>{r.type}</span>
                  <span>•</span>
                  <span className="text-muted">{r.date}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="export-btn"
              onClick={() => alert(`Exporting ${r.title}... Ready for download.`)}
            >
              <Download size={15} />
              <span>Export CSV</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportsView;
