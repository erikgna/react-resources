"use client";

import { z } from "zod";

export const stockCardSchema = z.object({
  symbol: z.string().describe("Stock ticker symbol, e.g. AAPL"),
  name: z.string().describe("Full company name"),
  price: z.number().describe("Current stock price"),
  change: z.number().describe("Price change since previous close"),
  changePercent: z.number().describe("Percentage change since previous close"),
  open: z.number().describe("Opening price of the current session"),
  high: z.number().describe("Session high price"),
  low: z.number().describe("Session low price"),
  previousClose: z.number().describe("Previous session closing price"),
  volume: z.number().describe("Number of shares traded"),
  marketCap: z.number().describe("Market capitalisation in base currency"),
  peRatio: z.number().nullable().describe("Price-to-earnings ratio"),
  week52High: z.number().describe("52-week high price"),
  week52Low: z.number().describe("52-week low price"),
  currency: z.string().describe("Currency code, e.g. USD"),
});

type StockCardProps = z.infer<typeof stockCardSchema>;

function formatLargeNumber(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  return n?.toLocaleString() ?? "0";
}

function formatVolume(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n?.toLocaleString() ?? "0";
}

export function StockCard({
  symbol,
  name,
  price,
  change,
  changePercent,
  open,
  high,
  low,
  previousClose,
  volume,
  marketCap,
  peRatio,
  week52High,
  week52Low,
  currency,
}: StockCardProps) {
  const isPositive = change && change >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-500";
  const badgeBg = isPositive ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-sm overflow-hidden max-w-sm w-full">
      <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
              {currency}
            </span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {symbol}
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400">{name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
              {price?.toFixed(2) ?? 0}
            </p>
            <span
              className={`inline-block mt-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${badgeBg} ${changeColor}`}
            >
              {isPositive ? "+" : ""}
              {change?.toFixed(2) ?? 0} ({isPositive ? "+" : ""}
              {changePercent?.toFixed(2) ?? 0}%)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px bg-gray-100 dark:bg-zinc-800">
        {[
          ["Open", open?.toFixed(2)],
          ["Prev. Close", previousClose?.toFixed(2)],
          ["High", high?.toFixed(2)],
          ["Low", low?.toFixed(2)],
          ["Volume", formatVolume(volume)],
          ["Market Cap", formatLargeNumber(marketCap)],
          ["52W High", week52High?.toFixed(2)],
          ["52W Low", week52Low?.toFixed(2)],
          ["P/E Ratio", peRatio !== null ? peRatio?.toFixed(1) ?? "0" : "N/A"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="bg-white dark:bg-zinc-900 px-4 py-3 flex flex-col gap-0.5"
          >
            <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-zinc-500 font-medium">
              {label}
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-zinc-100 tabular-nums">
              {value ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
