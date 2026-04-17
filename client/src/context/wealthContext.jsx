import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./userContext";

export const WealthContext = createContext();

const STORAGE_PREFIX = "worthme-wealth";

const emptyWallet = {
  summary: null,
  transactions: [],
  worth: "0.00",
  updatedAt: null,
};

const getUserStorageKey = (user) => {
  const identifier = user?.email || user?.id || "guest";
  return `${STORAGE_PREFIX}:${identifier}`;
};

const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value) ?? fallback;
  } catch {
    return fallback;
  }
};

const normalizeAmount = (value) => {
  const numeric = parseFloat(String(value ?? "0").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatAmount = (value) => normalizeAmount(value).toFixed(2);

const makeDefaultState = () => ({
  wallets: {
    mpesa: { ...emptyWallet },
    airtel: { ...emptyWallet },
  },
});

export const WealthProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [storageKey, setStorageKey] = useState(() => getUserStorageKey(user));
  const [wealthState, setWealthState] = useState(() => makeDefaultState());

  useEffect(() => {
    const nextKey = getUserStorageKey(user);
    setStorageKey(nextKey);
    const cached = localStorage.getItem(nextKey);
    setWealthState(cached ? safeParse(cached, makeDefaultState()) : makeDefaultState());
  }, [user]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(wealthState));
  }, [storageKey, wealthState]);

  const saveWalletSnapshot = (provider, snapshot) => {
    const key = String(provider || "").toLowerCase();
    if (!["mpesa", "airtel"].includes(key)) return;

    setWealthState((prev) => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [key]: {
          summary: snapshot.summary || null,
          transactions: snapshot.transactions || [],
          worth: formatAmount(snapshot.worth ?? snapshot.balance ?? "0.00"),
          provider: snapshot.provider || key,
          label: snapshot.label || snapshot.providerLabel || key,
          customerName: snapshot.customerName || "",
          mobileNumber: snapshot.mobileNumber || "",
          statementPeriod: snapshot.statementPeriod || "",
          requestDate: snapshot.requestDate || "",
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const clearWalletSnapshot = (provider) => {
    const key = String(provider || "").toLowerCase();
    if (!["mpesa", "airtel"].includes(key)) return;

    setWealthState((prev) => ({
      ...prev,
      wallets: {
        ...prev.wallets,
        [key]: { ...emptyWallet },
      },
    }));
  };

  const trackedWallets = useMemo(() => {
    return [
      {
        key: "mpesa",
        name: "M-Pesa",
        label: wealthState.wallets.mpesa?.label || "M-Pesa Wallet",
        worth: wealthState.wallets.mpesa?.worth || "0.00",
        customerName: wealthState.wallets.mpesa?.customerName || "",
        statementPeriod: wealthState.wallets.mpesa?.statementPeriod || "",
        summary: wealthState.wallets.mpesa?.summary || null,
        count: wealthState.wallets.mpesa?.transactions?.length || 0,
        accent: "#2db742",
      },
      {
        key: "airtel",
        name: "Airtel Money",
        label: wealthState.wallets.airtel?.label || "Airtel Wallet",
        worth: wealthState.wallets.airtel?.worth || "0.00",
        customerName: wealthState.wallets.airtel?.customerName || "",
        statementPeriod: wealthState.wallets.airtel?.statementPeriod || "",
        summary: wealthState.wallets.airtel?.summary || null,
        count: wealthState.wallets.airtel?.transactions?.length || 0,
        accent: "#e60000",
      },
    ];
  }, [wealthState]);

  const totalWorth = useMemo(() => {
    return trackedWallets
      .reduce((sum, wallet) => sum + normalizeAmount(wallet.worth), 0)
      .toFixed(2);
  }, [trackedWallets]);

  const totalTrackedTransactions = useMemo(() => {
    return (
      (wealthState.wallets.mpesa?.transactions?.length || 0) +
      (wealthState.wallets.airtel?.transactions?.length || 0)
    );
  }, [wealthState]);

  const recentTransactions = useMemo(() => {
    const mpesaTx = (wealthState.wallets.mpesa?.transactions || [])
      .slice(0, 3)
      .map((tx) => ({
        provider: "M-Pesa",
        label: tx.details || "M-Pesa transaction",
        amount: tx.paidIn && tx.paidIn !== "0.00" ? `+${tx.paidIn}` : tx.withdrawn && tx.withdrawn !== "0.00" ? `-${tx.withdrawn}` : tx.balance,
        balance: tx.balance || "0.00",
        timestamp: tx.completionTime || "",
      }));

    const airtelTx = (wealthState.wallets.airtel?.transactions || [])
      .slice(0, 3)
      .map((tx) => ({
        provider: "Airtel Money",
        label: tx.description || "Airtel transaction",
        amount: tx.credit && tx.credit !== "0.00" ? `+Ksh ${tx.credit}` : tx.debit && tx.debit !== "0.00" ? `-Ksh ${tx.debit}` : `Ksh ${tx.balance || "0.00"}`,
        balance: tx.balance || "0.00",
        timestamp: tx.transactionDate || "",
      }));

    return [...mpesaTx, ...airtelTx];
  }, [wealthState]);

  return (
    <WealthContext.Provider
      value={{
        wealthState,
        saveWalletSnapshot,
        clearWalletSnapshot,
        trackedWallets,
        totalWorth,
        totalTrackedTransactions,
        recentTransactions,
      }}
    >
      {children}
    </WealthContext.Provider>
  );
};
