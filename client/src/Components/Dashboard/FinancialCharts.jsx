import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatMoney, normalizeMoney } from "../../utils/money";

const COLORS = {
  mpesa: "#34d399",
  airtel: "#fb7185",
  im: "#93a8ff",
  inflow: "#34d399",
  outflow: "#fb7185",
};

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  const dayFirst = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dayFirst) {
    const parsed = new Date(Number(dayFirst[3]), Number(dayFirst[2]) - 1, Number(dayFirst[1]));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const amount = (value) => normalizeMoney(value || 0);

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const formatCompactMoney = (value) => {
  const number = Number(value) || 0;
  if (Math.abs(number) >= 1_000_000) return `Ksh ${(number / 1_000_000).toFixed(1)}m`;
  if (Math.abs(number) >= 10_000) return `Ksh ${(number / 1_000).toFixed(0)}k`;
  return `Ksh ${formatMoney(number)}`;
};

const MotionChartSvg = ({ label, children, className = "" }) => (
  <svg className={`financial-chart-svg ${className}`} viewBox="0 0 720 280" role="img" aria-label={label}>
    {children}
  </svg>
);

const EmptyChart = ({ children }) => <div className="financial-chart-empty">{children}</div>;

export const BalanceHistoryChart = ({ snapshots = [], isLoading = false }) => {
  const reduceMotion = useReducedMotion();
  const points = useMemo(() => {
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
    if (sorted.length <= 14) return sorted;
    return Array.from({ length: 14 }, (_, index) => sorted[Math.round((index * (sorted.length - 1)) / 13)]);
  }, [snapshots]);

  const chartPoints = useMemo(() => {
    if (!points.length) return [];
    const values = points.map((point) => amount(point.total));
    const low = Math.min(...values);
    const high = Math.max(...values);
    const padding = Math.max((high - low) * 0.16, Math.abs(high) * 0.025, 1);
    const min = low - padding;
    const max = high + padding;
    const left = 64;
    const right = 704;
    const top = 20;
    const bottom = 216;

    return points.map((point, index) => ({
      ...point,
      value: values[index],
      x: points.length === 1 ? (left + right) / 2 : left + (index * (right - left)) / (points.length - 1),
      y: bottom - ((values[index] - min) / (max - min)) * (bottom - top),
    }));
  }, [points]);

  const linePath = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const areaPath = chartPoints.length
    ? `${linePath} L${chartPoints[chartPoints.length - 1].x},216 L${chartPoints[0].x},216 Z`
    : "";

  return (
    <section className="financial-chart-panel" aria-labelledby="balance-history-title">
      <div className="financial-chart-heading">
        <div>
          <p className="chart-kicker">Portfolio history</p>
          <h3 id="balance-history-title">Net worth over time</h3>
        </div>
        <span className="chart-period">Last 180 days</span>
      </div>
      {points.length ? (
        <>
          <div className="chart-current-value">Ksh {formatMoney(points[points.length - 1].total)}</div>
          <MotionChartSvg label="Net worth by captured balance date">
            {[0, 1, 2, 3].map((step) => {
              const y = 24 + step * 64;
              return <line key={step} className="chart-grid-line" x1="56" x2="704" y1={y} y2={y} />;
            })}
            {areaPath && (
              <motion.path
                d={areaPath}
                className="chart-area-fill"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.7 }}
              />
            )}
            {linePath && (
              <motion.path
                d={linePath}
                className="chart-line"
                initial={reduceMotion ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.9, ease: "easeOut" }}
              />
            )}
            {chartPoints.map((point, index) => (
              <motion.circle
                key={point.date}
                cx={point.x}
                cy={point.y}
                r="4"
                className="chart-point"
                initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: reduceMotion ? 0 : 0.12 + index * 0.035, duration: reduceMotion ? 0 : 0.22 }}
              >
                <title>{`${point.date}: Ksh ${formatMoney(point.total)}`}</title>
              </motion.circle>
            ))}
            {chartPoints.filter((_, index) => index === 0 || index === chartPoints.length - 1 || index % 4 === 0).map((point) => (
              <text key={`label-${point.date}`} x={point.x} y="248" className="chart-axis-label" textAnchor="middle">
                {new Date(`${point.date}T00:00:00`).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
              </text>
            ))}
          </MotionChartSvg>
          <p className="chart-caption">
            {points.length === 1
              ? "A second daily balance capture will reveal your trend."
              : "Each point records the latest imported or synced balance for that day."}
          </p>
        </>
      ) : (
        <EmptyChart>
          {isLoading ? "Loading balance history…" : "Your balance history will build as you upload statements or sync wallet balances."}
        </EmptyChart>
      )}
    </section>
  );
};

export const MonthlyCashFlowChart = ({ wealthState }) => {
  const reduceMotion = useReducedMotion();
  const months = useMemo(() => {
    const now = new Date();
    const result = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      return {
        key: monthKey(month),
        label: month.toLocaleDateString("en-KE", { month: "short" }),
        received: 0,
        spent: 0,
      };
    });
    const byMonth = new Map(result.map((month) => [month.key, month]));
    const wallets = wealthState?.wallets || {};
    const transactionFields = {
      mpesa: { date: ["completionTime", "transactionDate", "date"], received: ["paidIn"], spent: ["withdrawn"] },
      airtel: { date: ["transactionDate", "date"], received: ["credit"], spent: ["debit"] },
      im: { date: ["tranDate", "date"], received: ["deposits"], spent: ["withdrawals"] },
    };

    Object.entries(transactionFields).forEach(([provider, fields]) => {
      (wallets[provider]?.transactions || []).forEach((transaction) => {
        const dateValue = fields.date.map((field) => transaction[field]).find(Boolean);
        const date = parseDate(dateValue);
        const month = date && byMonth.get(monthKey(date));
        if (!month) return;

        fields.received.forEach((field) => { month.received += amount(transaction[field]); });
        fields.spent.forEach((field) => { month.spent += amount(transaction[field]); });
      });
    });

    return result;
  }, [wealthState]);

  const maxValue = Math.max(1, ...months.flatMap((month) => [month.received, month.spent]));
  const hasData = months.some((month) => month.received > 0 || month.spent > 0);
  const plotTop = 20;
  const plotBottom = 216;
  const plotHeight = plotBottom - plotTop;
  const groupWidth = 82;

  return (
    <section className="financial-chart-panel" aria-labelledby="cash-flow-chart-title">
      <div className="financial-chart-heading">
        <div>
          <p className="chart-kicker">Statement activity</p>
          <h3 id="cash-flow-chart-title">Monthly cash flow</h3>
        </div>
        <div className="chart-legend">
          <span><i className="legend-dot inflow" /> Inflow</span>
          <span><i className="legend-dot outflow" /> Outflow</span>
        </div>
      </div>
      {hasData ? (
        <MotionChartSvg label="Monthly inflows and outflows for the last six months">
          {[0, 1, 2, 3].map((step) => {
            const y = plotTop + step * (plotHeight / 3);
            return <line key={step} className="chart-grid-line" x1="42" x2="704" y1={y} y2={y} />;
          })}
          {months.map((month, index) => {
            const center = 82 + index * 108;
            const values = [
              { value: month.received, x: center - groupWidth / 2, color: COLORS.inflow },
              { value: month.spent, x: center + 4, color: COLORS.outflow },
            ];
            return (
              <g key={month.key}>
                {values.map((bar, barIndex) => {
                  const height = (bar.value / maxValue) * plotHeight;
                  const y = plotBottom - height;
                  return (
                    <motion.rect
                      key={barIndex}
                      x={bar.x}
                      width="31"
                      rx="6"
                      fill={bar.color}
                      initial={reduceMotion ? false : { y: plotBottom, height: 0, opacity: 0.5 }}
                      animate={{ y, height, opacity: 0.9 }}
                      transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : index * 0.06 + barIndex * 0.03, ease: "easeOut" }}
                    >
                      <title>{`${month.label}: ${barIndex === 0 ? "Inflow" : "Outflow"} Ksh ${formatMoney(bar.value)}`}</title>
                    </motion.rect>
                  );
                })}
                <text x={center} y="248" className="chart-axis-label" textAnchor="middle">{month.label}</text>
              </g>
            );
          })}
        </MotionChartSvg>
      ) : (
        <EmptyChart>No dated transactions in the last six months yet.</EmptyChart>
      )}
    </section>
  );
};

export const ProviderSpendChart = ({ byProvider = [] }) => {
  const reduceMotion = useReducedMotion();
  const segments = byProvider
    .map((provider) => ({
      key: provider.key,
      label: provider.name,
      value: amount(provider.spent),
      color: COLORS[provider.key] || "#f4e8cf",
    }))
    .filter((provider) => provider.value > 0);
  const total = segments.reduce((sum, provider) => sum + provider.value, 0);
  const circumference = 2 * Math.PI * 74;
  let offset = 0;

  return (
    <section className="financial-chart-panel provider-chart-panel" aria-labelledby="provider-spend-chart-title">
      <div className="financial-chart-heading">
        <div>
          <p className="chart-kicker">Spending mix</p>
          <h3 id="provider-spend-chart-title">Outflow by account</h3>
        </div>
      </div>
      {total > 0 ? (
        <div className="provider-chart-content">
          <div className="provider-donut-wrap">
            <svg viewBox="0 0 200 200" role="img" aria-label="Outflow share by account">
              <circle cx="100" cy="100" r="74" className="provider-donut-track" />
              <g transform="rotate(-90 100 100)">
                {segments.map((segment) => {
                  const share = segment.value / total;
                  const segmentOffset = offset;
                  offset += share;
                  return (
                    <motion.circle
                      key={segment.key}
                      cx="100"
                      cy="100"
                      r="74"
                      fill="none"
                      stroke={segment.color}
                      strokeWidth="19"
                      strokeDashoffset={-segmentOffset * circumference}
                      initial={reduceMotion ? false : { opacity: 0.35, strokeDasharray: `0 ${circumference}` }}
                      animate={{ opacity: 1, strokeDasharray: `${share * circumference} ${circumference}` }}
                      transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : segmentOffset * 0.35, ease: "easeOut" }}
                    />
                  );
                })}
              </g>
              <text x="100" y="96" className="donut-total-label" textAnchor="middle">Total outflow</text>
              <text x="100" y="118" className="donut-total-value" textAnchor="middle">{formatCompactMoney(total)}</text>
            </svg>
          </div>
          <ul className="provider-chart-legend">
            {segments.map((segment) => (
              <li key={segment.key}>
                <span><i className="legend-dot" style={{ backgroundColor: segment.color }} />{segment.label}</span>
                <strong>{Math.round((segment.value / total) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyChart>Provider spending will appear after statements with debits are added.</EmptyChart>
      )}
    </section>
  );
};

export const BalanceCompositionChart = ({ wallets = [], totalWorth = 0 }) => {
  const reduceMotion = useReducedMotion();
  const values = wallets
    .map((wallet) => ({
      key: wallet.key,
      label: wallet.name,
      value: amount(wallet.worth),
      color: COLORS[wallet.key] || wallet.accent || "#f4e8cf",
    }))
    .filter((wallet) => wallet.value > 0);
  const total = amount(totalWorth);
  const circumference = 2 * Math.PI * 74;
  let offset = 0;

  return (
    <section className="financial-chart-panel composition-panel" aria-labelledby="balance-composition-title">
      <div className="financial-chart-heading">
        <div>
          <p className="chart-kicker">Current balances</p>
          <h3 id="balance-composition-title">Where your money is held</h3>
        </div>
      </div>
      {total > 0 ? (
        <div className="provider-chart-content">
          <div className="provider-donut-wrap">
            <svg viewBox="0 0 200 200" role="img" aria-label="Current balance share by account">
              <circle cx="100" cy="100" r="74" className="provider-donut-track" />
              <g transform="rotate(-90 100 100)">
                {values.map((wallet) => {
                  const share = wallet.value / total;
                  const segmentOffset = offset;
                  offset += share;
                  return (
                    <motion.circle
                      key={wallet.key}
                      cx="100"
                      cy="100"
                      r="74"
                      fill="none"
                      stroke={wallet.color}
                      strokeWidth="19"
                      strokeDashoffset={-segmentOffset * circumference}
                      initial={reduceMotion ? false : { opacity: 0.35, strokeDasharray: `0 ${circumference}` }}
                      animate={{ opacity: 1, strokeDasharray: `${share * circumference} ${circumference}` }}
                      transition={{ duration: reduceMotion ? 0 : 0.75, delay: reduceMotion ? 0 : segmentOffset * 0.35, ease: "easeOut" }}
                    >
                      <title>{`${wallet.label}: Ksh ${formatMoney(wallet.value)}`}</title>
                    </motion.circle>
                  );
                })}
              </g>
              <text x="100" y="96" className="donut-total-label" textAnchor="middle">Tracked total</text>
              <text x="100" y="118" className="donut-total-value" textAnchor="middle">{formatCompactMoney(total)}</text>
            </svg>
          </div>
          <ul className="provider-chart-legend">
            {values.map((wallet) => (
              <li key={wallet.key}>
                <span><i className="legend-dot" style={{ backgroundColor: wallet.color }} />{wallet.label}</span>
                <strong>{Math.round((wallet.value / total) * 100)}%</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <EmptyChart>Connect or upload an account statement to see balance composition.</EmptyChart>
      )}
    </section>
  );
};
