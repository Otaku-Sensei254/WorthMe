import React, { useContext, useState, useMemo } from "react";
import { WealthContext } from "../../../context/wealthContext";
import { formatMoney, normalizeMoney } from "../../../utils/money";
import { Search } from "lucide-react";
import "../../styles/dashboard.css";

const TransactionsView = () => {
  const { wealthState } = useContext(WealthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'inflow', 'outflow'
  const [filterProvider, setFilterProvider] = useState("all"); // 'all', 'mpesa', 'airtel', 'im'

  // Aggregate all transactions across all parsed statements
  const allTransactions = useMemo(() => {
    const list = [];
    const wallets = wealthState?.wallets || {};

    // M-Pesa
    (wallets.mpesa?.transactions || []).forEach((tx) => {
      const isPaidIn = Boolean(tx.paidIn && normalizeMoney(tx.paidIn) > 0);
      const isPaidOut = Boolean(tx.paidOut && normalizeMoney(tx.paidOut) > 0);
      list.push({
        id: `mpesa-${tx.receiptNo || tx.completionTime || Math.random()}`,
        provider: "M-Pesa",
        providerKey: "mpesa",
        date: tx.completionTime || "—",
        ref: tx.receiptNo || "—",
        details: tx.details || "Transaction",
        type: isPaidIn ? "inflow" : isPaidOut ? "outflow" : "other",
        amount: isPaidIn ? tx.paidIn : tx.paidOut || tx.amount || "0.00",
        balance: tx.balance || "—",
      });
    });

    // Airtel
    (wallets.airtel?.transactions || []).forEach((tx) => {
      const isCredit = Boolean(tx.credit && normalizeMoney(tx.credit) > 0);
      list.push({
        id: `airtel-${tx.id || tx.date || Math.random()}`,
        provider: "Airtel Money",
        providerKey: "airtel",
        date: tx.date || "—",
        ref: tx.id || tx.ref || "—",
        details: tx.description || "Airtel Transaction",
        type: isCredit ? "inflow" : "outflow",
        amount: isCredit ? tx.credit : tx.debit || tx.amount || "0.00",
        balance: tx.balance || "—",
      });
    });

    // I&M Bank
    (wallets.im?.transactions || []).forEach((tx) => {
      const isCredit = Boolean(tx.credit && normalizeMoney(tx.credit) > 0);
      list.push({
        id: `im-${tx.ref || tx.postDate || Math.random()}`,
        provider: "I&M Bank",
        providerKey: "im",
        date: tx.postDate || tx.valueDate || "—",
        ref: tx.ref || "—",
        details: tx.narrative || tx.description || "Bank Entry",
        type: isCredit ? "inflow" : "outflow",
        amount: isCredit ? tx.credit : tx.debit || tx.amount || "0.00",
        balance: tx.runningBalance || tx.balance || "—",
      });
    });

    return list;
  }, [wealthState]);

  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesSearch =
        tx.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.provider.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        filterType === "all" ||
        (filterType === "inflow" && tx.type === "inflow") ||
        (filterType === "outflow" && tx.type === "outflow");

      const matchesProvider =
        filterProvider === "all" || tx.providerKey === filterProvider;

      return matchesSearch && matchesType && matchesProvider;
    });
  }, [allTransactions, searchTerm, filterType, filterProvider]);

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Transactions Ledger</h3>
          <p>Consolidated statement activity across mobile wallets and bank accounts.</p>
        </div>
      </div>

      <div className="table-controls">
        <div className="search-pill">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search merchants, references, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Activity
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === "inflow" ? "active" : ""}`}
            onClick={() => setFilterType("inflow")}
          >
            Inflow
          </button>
          <button
            type="button"
            className={`filter-pill ${filterType === "outflow" ? "active" : ""}`}
            onClick={() => setFilterType("outflow")}
          >
            Outflow
          </button>
        </div>

        <div className="filter-pill-group">
          <button
            type="button"
            className={`filter-pill ${filterProvider === "all" ? "active" : ""}`}
            onClick={() => setFilterProvider("all")}
          >
            All Sources
          </button>
          <button
            type="button"
            className={`filter-pill ${filterProvider === "mpesa" ? "active" : ""}`}
            onClick={() => setFilterProvider("mpesa")}
          >
            M-Pesa
          </button>
          <button
            type="button"
            className={`filter-pill ${filterProvider === "airtel" ? "active" : ""}`}
            onClick={() => setFilterProvider("airtel")}
          >
            Airtel
          </button>
          <button
            type="button"
            className={`filter-pill ${filterProvider === "im" ? "active" : ""}`}
            onClick={() => setFilterProvider("im")}
          >
            I&M
          </button>
        </div>
      </div>

      <div className="card-table-wrap">
        {filtered.length > 0 ? (
          <table className="ledger-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="text-right">Amount (KES)</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-muted">{tx.date}</td>
                  <td>
                    <span className={`source-tag tag-${tx.providerKey}`}>
                      {tx.provider}
                    </span>
                  </td>
                  <td className="tx-details-cell">{tx.details}</td>
                  <td className="mono-cell">{tx.ref}</td>
                  <td className={`text-right ${tx.type === "inflow" ? "amt-inflow" : "amt-outflow"}`}>
                    {tx.type === "inflow" ? "+" : "-"}Ksh {formatMoney(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-panel">
            <h4>No transactions match your search</h4>
            <p>Upload statements from M-Pesa, Airtel, or I&M Bank to populate this ledger.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsView;
