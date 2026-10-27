import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { UserContext } from "./userContext";

export const  WealthContext = createContext();

const STORAGE_PREFIX = "worthme-wealth";
const LAST_KEY_STORAGE = `${STORAGE_PREFIX}:last_key`;

const emptyWallet = {
  summary: null,
  transactions: [], 
  worth: "0.00",
  updatedAt: null,
};

const TRACKED_PROVIDER_KEYS = ["mpesa", "airtel", "im"];

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
    im: { ...emptyWallet },
  },
});

const hydrateState = (cached) => {
  const base = makeDefaultState();
  if (!cached || typeof cached !== "object") return base;
  return {
    ...base,
    ...cached,
    wallets: {
      ...base.wallets,
      ...(cached.wallets || {}),
    },
  };
};

export const WealthProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [storageKey, setStorageKey] = useState(() => getUserStorageKey(user));
  const [wealthState, setWealthState] = useState(() => makeDefaultState());

  useEffect(() => {
    const nextKey = getUserStorageKey(user);
    setStorageKey(nextKey);
    const cached = localStorage.getItem(nextKey);
    if (cached) {
      setWealthState(hydrateState(safeParse(cached, makeDefaultState())));
      localStorage.setItem(LAST_KEY_STORAGE, nextKey);
      return;
    }

    // Fallback to the last known key (useful when the session check is flaky).
    const lastKey = localStorage.getItem(LAST_KEY_STORAGE);
    if (lastKey) {
      const lastCached = localStorage.getItem(lastKey);
      if (lastCached) {
        setWealthState(hydrateState(safeParse(lastCached, makeDefaultState())));
        return;
      }
    }

    setWealthState(makeDefaultState());
  }, [user]);

  // Rehydrate from DB on app start (covers dashboard refresh).
  useEffect(() => {
    const loadFromDb = async () => {
      if (!user) return;

      const providers = ["mpesa", "airtel", "im"];

      const fetchLatest = async (provider) => {
        const res = await fetch(`http://localhost:4000/api/statements/latest?provider=${provider}`, {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.success || !Array.isArray(data.transactions) || data.transactions.length === 0) return null;
        return data;
      };

      try {
        const results = await Promise.all(providers.map(fetchLatest));

        setWealthState((prev) => {
          const next = hydrateState(prev);
          const now = new Date().toISOString();

          results.forEach((data) => {
            if (!data) return;
            const provider = String(data.provider || "").toLowerCase();
            if (!TRACKED_PROVIDER_KEYS.includes(provider)) return;

            // Do not overwrite local state if it already has transactions (keeps live M-Pesa).
            const existing = next.wallets?.[provider];
            if (existing?.transactions?.length) return;

            const summary = data.summary || null;
            const transactions = data.transactions || [];

            let worth = "0.00";
            let label = provider;
            let customerName = "";
            let mobileNumber = "";
            let statementPeriod = "";
            let accountNumber = "";
            let accountType = "";

            if (provider === "mpesa") {
              worth = summary?.currentBalance || "0.00";
              label = "M-Pesa Wallet";
              customerName = summary?.customerName || "";
              mobileNumber = summary?.mobileNumber || "";
              statementPeriod = summary?.statementPeriod || "";
            } else if (provider === "airtel") {
              worth = summary?.closingBalance || "0.00";
              label = "Airtel Wallet";
              customerName = summary?.customerName || "";
              mobileNumber = summary?.mobileNumber || "";
              statementPeriod = summary?.statementPeriod || "";
            } else if (provider === "im") {
              worth =
                summary?.balanceAsOf ||
                summary?.effectiveAvailableBalance ||
                summary?.openingBalance ||
                "0.00";
              label = "I&M Bank Account";
              customerName = summary?.accountName || "";
              accountNumber = summary?.accountNumber || "";
              accountType = summary?.accountType || "";
              statementPeriod = summary?.statementPeriod || "";
            }

            next.wallets[provider] = {
              ...(next.wallets[provider] || emptyWallet),
              summary,
              transactions,
              worth: formatAmount(worth),
              provider: provider === "im" ? "I&M Bank" : provider === "airtel" ? "Airtel Money" : "M-Pesa",
              label,
              customerName,
              mobileNumber,
              accountNumber,
              accountType,
              statementPeriod,
              requestDate: summary?.requestDate || "",
              updatedAt: now,
            };
          });

          return next;
        });
      } catch {
        // ignore (offline/back-end down)
      }
    };

    loadFromDb();
  }, [user]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(wealthState));
    localStorage.setItem(LAST_KEY_STORAGE, storageKey);
  }, [storageKey, wealthState]);

  const saveWalletSnapshot = (provider, snapshot) => {
    const key = String(provider || "").toLowerCase();
    if (!TRACKED_PROVIDER_KEYS.includes(key)) return;

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
          accountNumber: snapshot.accountNumber || "",
          accountType: snapshot.accountType || "",
          statementPeriod: snapshot.statementPeriod || "",
          requestDate: snapshot.requestDate || "",
          isLive: Boolean(snapshot.isLive),
          lastSynced: snapshot.lastSynced || "",
          updatedAt: new Date().toISOString(),
        },
      },
    }));
  };

  const clearWalletSnapshot = (provider) => {
    const key = String(provider || "").toLowerCase();
    if (!TRACKED_PROVIDER_KEYS.includes(key)) return;

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
      {
        key: "im",
        name: "I&M Bank",
        label: wealthState.wallets.im?.label || "I&M Bank Account",
        worth: wealthState.wallets.im?.worth || "0.00",
        customerName: wealthState.wallets.im?.customerName || "",
        accountNumber: wealthState.wallets.im?.accountNumber || "",
        accountType: wealthState.wallets.im?.accountType || "",
        statementPeriod: wealthState.wallets.im?.statementPeriod || "",
        summary: wealthState.wallets.im?.summary || null,
        count: wealthState.wallets.im?.transactions?.length || 0,
        accent: "#00339f",
      },
    ];
  }, [wealthState]);

  const totalWorth = useMemo(() => {
    return trackedWallets
      .reduce((sum, wallet) => sum + normalizeAmount(wallet.worth), 0)
      .toFixed(2);
  }, [trackedWallets]);

  const totalTrackedTransactions = useMemo(() => {
    return TRACKED_PROVIDER_KEYS.reduce((count, key) => (
      count + (wealthState.wallets[key]?.transactions?.length || 0)
    ), 0);
  }, [wealthState]);

  const spendingInsights = useMemo(() => {
    const mpesaSpent = (wealthState.wallets.mpesa?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.withdrawn), 0);
    const mpesaReceived = (wealthState.wallets.mpesa?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.paidIn), 0);

    const airtelSpent = (wealthState.wallets.airtel?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.debit), 0);
    const airtelReceived = (wealthState.wallets.airtel?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.credit), 0);

    const imSpent = (wealthState.wallets.im?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.withdrawals), 0);
    const imReceived = (wealthState.wallets.im?.transactions || [])
      .reduce((sum, tx) => sum + normalizeAmount(tx.deposits), 0);

    const byProvider = [
      { key: "mpesa", name: "M-Pesa", spent: mpesaSpent, received: mpesaReceived, accent: "#2db742" },
      { key: "airtel", name: "Airtel Money", spent: airtelSpent, received: airtelReceived, accent: "#e60000" },
      { key: "im", name: "I&M Bank", spent: imSpent, received: imReceived, accent: "#00339f" },
    ];

    const totalSpent = byProvider.reduce((sum, item) => sum + item.spent, 0);
    const totalReceived = byProvider.reduce((sum, item) => sum + item.received, 0);
    const highestSpendSource = byProvider.reduce((highest, item) => (
      item.spent > highest.spent ? item : highest
    ), byProvider[0]);

    return {
      totalSpent: totalSpent.toFixed(2),
      totalReceived: totalReceived.toFixed(2),
      netMovement: (totalReceived - totalSpent).toFixed(2),
      highestSpendSource,
      byProvider: byProvider.map((item) => ({
        ...item,
        spent: item.spent.toFixed(2),
        received: item.received.toFixed(2),
      })),
    };
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

    const imTx = (wealthState.wallets.im?.transactions || [])
      .slice(0, 4)
      .map((tx) => ({
        provider: "I&M Bank",
        label: tx.transactionNarrative || "I&M transaction",
        amount: tx.deposits && tx.deposits !== "0.00" ? `+Ksh ${tx.deposits}` : tx.withdrawals && tx.withdrawals !== "0.00" ? `-Ksh ${tx.withdrawals}` : `Ksh ${tx.balance || "0.00"}`,
        balance: tx.balance || "0.00",
        timestamp: tx.tranDate || "",
      }));

    return [...mpesaTx, ...airtelTx, ...imTx];
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
        spendingInsights,
        recentTransactions,
      }}
    >
      {children}
    </WealthContext.Provider>
  );
};
