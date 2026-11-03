import React, { useEffect, useState } from "react";
import "../../styles/dashboard.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:4000";

const MarketWatchView = () => {
  const [data, setData] = useState({ stocks: [], fxRates: [], yields: [], lastUpdated: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/market-watch`, {
          headers: { Accept: "application/json" },
          credentials: "include",
        });
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stocks = data.stocks || [];
  const fxRates = data.fxRates || [];
  const yields = data.yields || [];

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h3>Market Watch & Economic Benchmarks</h3>
          <p>Live Nairobi Securities Exchange (NSE) indices, Central Bank FX rates, and Treasury yield curves.</p>
        </div>
      </div>

      <div className="metric-strip">
        {fxRates.map((fx, i) => (
          <div key={i} className="metric-box">
            <span>{fx.pair}</span>
            <strong className="text-white">KES {fx.rate}</strong>
            <small className={fx.isPositive ? "text-emerald" : "text-rose"}>
              {fx.change} vs yesterday
            </small>
          </div>
        ))}
      </div>

      <div className="two-column-grid">
        <div className="view-panel">
          <h4>Nairobi Securities Exchange (NSE)</h4>
          <p className="panel-desc">Top traded Kenyan counters by market capitalization.</p>
          <div className="stock-list">
            {stocks.map((s) => (
              <div key={s.ticker} className="stock-row">
                <div>
                  <strong>{s.ticker}</strong>
                  <span className="stock-name">{s.name}</span>
                </div>
                <div className="stock-price-block">
                  <span className="font-bold text-white">KES {s.price}</span>
                  <small className={s.isPositive ? "text-emerald" : "text-rose"}>
                    {s.change}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="view-panel">
          <h4>CBK Treasury Bill Benchmark</h4>
          <p className="panel-desc">Central Bank of Kenya auction yields.</p>
          <div className="yield-list">
            {yields.map((y, i) => (
              <div key={i} className="yield-row">
                <span>{y.term}</span>
                <strong className="text-champagne">{y.rate}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketWatchView;
