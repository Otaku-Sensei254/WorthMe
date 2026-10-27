import React from "react";
import "../../styles/dashboard.css";

const MarketWatchView = () => {
  const stocks = [
    { ticker: "SCOM", name: "Safaricom PLC", price: "17.40", change: "+1.75%", isPositive: true },
    { ticker: "EQTY", name: "Equity Group Holdings", price: "43.50", change: "+0.80%", isPositive: true },
    { ticker: "KCB", name: "KCB Group PLC", price: "34.15", change: "-0.45%", isPositive: false },
    { ticker: "EABL", name: "East African Breweries", price: "162.00", change: "+2.20%", isPositive: true },
    { ticker: "COOP", name: "Co-operative Bank", price: "13.25", change: "+0.00%", isPositive: true },
    { ticker: "NCBA", name: "NCBA Group PLC", price: "41.00", change: "+1.10%", isPositive: true },
  ];

  const fxRates = [
    { pair: "USD / KES", rate: "128.50", change: "-0.15%", isPositive: true },
    { pair: "GBP / KES", rate: "166.20", change: "+0.30%", isPositive: false },
    { pair: "EUR / KES", rate: "139.80", change: "+0.10%", isPositive: false },
  ];

  const yields = [
    { term: "91-Day Treasury Bill", rate: "15.75%" },
    { term: "182-Day Treasury Bill", rate: "16.45%" },
    { term: "364-Day Treasury Bill", rate: "16.85%" },
  ];

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
