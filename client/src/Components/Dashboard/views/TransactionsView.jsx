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
    const seen = new Set();

    // M-Pesa
    (wallets.mpesa?.transactions || []).forEach((tx) => {
      const paidIn = tx.paidIn ?? tx.credit ?? tx.amountPaidIn;
      const paidOut = tx.paidOut ?? tx.withdrawn ?? tx.debit ?? tx.amountWithdrawn;
      const isPaidIn = Boolean(normalizeMoney(paidIn) > 0);
      const isPaidOut = Boolean(normalizeMoney(paidOut) > 0);
      const receiptNo = tx.receiptNo || tx.ref || tx.id;
      const key = receiptNo && receiptNo !== "—" && receiptNo.trim() !== "" 
        ? `mpesa:${receiptNo}` 
        : `mpesa:${tx.completionTime || tx.date}:${paidIn}:${paidOut}:${tx.details || tx.transactionNarrative}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({
        id: `mpesa-${receiptNo || tx.completionTime || Math.random()}`,
        provider: "M-Pesa",
        providerKey: "mpesa",
        date: tx.completionTime || tx.date || "—",
        ref: receiptNo || "—",
        details: tx.details || tx.transactionNarrative || "Transaction",
        type: isPaidIn ? "inflow" : isPaidOut ? "outflow" : "other",
        amount: isPaidIn ? paidIn : paidOut || tx.amount || "0.00",
        balance: tx.balance || "—",
      });
    });

    // Airtel
    (wallets.airtel?.transactions || []).forEach((tx) => {
      const credit = tx.credit ?? tx.paidIn ?? tx.amountCredit;
      const debit = tx.debit ?? tx.withdrawn ?? tx.paidOut ?? tx.amountDebit;
      const isCredit = Boolean(normalizeMoney(credit) > 0);
      const receiptNo = tx.id || tx.ref || tx.receiptNo;
      const key = receiptNo && receiptNo !== "—" && receiptNo.trim() !== "" 
        ? `airtel:${receiptNo}` 
        : `airtel:${tx.date || tx.transactionDate || tx.completionTime}:${credit}:${debit}:${tx.description || tx.details}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({
        id: `airtel-${receiptNo || tx.date || Math.random()}`,
        provider: "Airtel Money",
        providerKey: "airtel",
        date: tx.date || tx.transactionDate || tx.completionTime || "—",
        ref: receiptNo || "—",
        details: tx.description || tx.details || tx.transactionNarrative || "Airtel Transaction",
        type: isCredit ? "inflow" : "outflow",
        amount: isCredit ? credit : debit || tx.amount || "0.00",
        balance: tx.balance || "—",
      });
    });

    // I&M Bank
    (wallets.im?.transactions || []).forEach((tx) => {
      const credit = tx.credit ?? tx.deposits ?? tx.paidIn;
      const debit = tx.debit ?? tx.withdrawals ?? tx.withdrawn ?? tx.paidOut;
      const isCredit = Boolean(normalizeMoney(credit) > 0);
      const receiptNo = tx.refNo || tx.ref;
      const key = receiptNo && receiptNo !== "—" && receiptNo.trim() !== "" 
        ? `im:${receiptNo}` 
        : `im:${tx.tranDate || tx.postDate || tx.valueDate}:${credit}:${debit}:${tx.narrative || tx.transactionNarrative}`;
      if (seen.has(key)) return;
      seen.add(key);
      list.push({
        id: `im-${receiptNo || tx.tranDate || Math.random()}`,
        provider: "I&M Bank",
        providerKey: "im",
        date: tx.postDate || tx.valueDate || tx.tranDate || tx.transactionDate || "—",
        ref: receiptNo || "—",
        details: tx.narrative || tx.transactionNarrative || tx.description || tx.details || "Bank Entry",
        type: isCredit ? "inflow" : "outflow",
        amount: isCredit ? credit : debit || tx.amount || "0.00",
        balance: tx.runningBalance || tx.balance || "—",
      });
    });

    return list;
  }, [wealthState]);

  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      const matchesSearch =
        (tx.details || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.ref || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.provider || "").toLowerCase().includes(searchTerm.toLowerCase());

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

      <div className="card-table-wrap transactions-ledger-wrap">
        {filtered.length > 0 ? (
          <table className="ledger-table transactions-ledger-table">
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
                  <td className="text-muted ledger-date-cell" data-label="Date">{tx.date}</td>
                  <td className="ledger-source-cell" data-label="Source">
                    <span className={`source-tag tag-${tx.providerKey}`}>
                      {tx.provider}
                    </span>
                  </td>
                  <td className="tx-details-cell ledger-description-cell" data-label="Description">{tx.details}</td>
                  <td className="mono-cell ledger-reference-cell" data-label="Reference">{tx.ref}</td>
                  <td className={`text-right ledger-amount-cell ${tx.type === "inflow" ? "amt-inflow" : tx.type === "outflow" ? "amt-outflow" : ""}`} data-label="Amount">
                    {tx.type === "inflow" ? "+" : tx.type === "outflow" ? "-" : ""}Ksh {formatMoney(tx.amount)}
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
