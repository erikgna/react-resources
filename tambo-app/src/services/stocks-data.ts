export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  marketCap: number;
  peRatio: number | null;
  week52High: number;
  week52Low: number;
  currency: string;
}

const mockStocks: Record<string, StockQuote> = {
  AAPL: {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 213.49,
    change: 2.15,
    changePercent: 1.02,
    open: 211.82,
    high: 214.3,
    low: 211.1,
    previousClose: 211.34,
    volume: 52_340_100,
    marketCap: 3_270_000_000_000,
    peRatio: 33.2,
    week52High: 237.23,
    week52Low: 164.08,
    currency: "USD",
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 415.32,
    change: -1.88,
    changePercent: -0.45,
    open: 417.5,
    high: 418.9,
    low: 413.2,
    previousClose: 417.2,
    volume: 18_920_400,
    marketCap: 3_090_000_000_000,
    peRatio: 36.8,
    week52High: 468.35,
    week52Low: 344.79,
    currency: "USD",
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: 172.63,
    change: 0.87,
    changePercent: 0.51,
    open: 171.9,
    high: 173.45,
    low: 171.2,
    previousClose: 171.76,
    volume: 22_150_300,
    marketCap: 2_150_000_000_000,
    peRatio: 22.4,
    week52High: 207.05,
    week52Low: 140.53,
    currency: "USD",
  },
  AMZN: {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: 198.12,
    change: 3.45,
    changePercent: 1.77,
    open: 195.2,
    high: 199.0,
    low: 194.8,
    previousClose: 194.67,
    volume: 35_670_200,
    marketCap: 2_090_000_000_000,
    peRatio: 43.1,
    week52High: 242.52,
    week52Low: 151.61,
    currency: "USD",
  },
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 875.4,
    change: -12.3,
    changePercent: -1.39,
    open: 890.0,
    high: 892.5,
    low: 872.1,
    previousClose: 887.7,
    volume: 41_230_900,
    marketCap: 2_150_000_000_000,
    peRatio: 68.9,
    week52High: 974.0,
    week52Low: 435.83,
    currency: "USD",
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 248.23,
    change: 5.67,
    changePercent: 2.34,
    open: 243.1,
    high: 250.0,
    low: 242.5,
    previousClose: 242.56,
    volume: 78_450_600,
    marketCap: 791_000_000_000,
    peRatio: 58.3,
    week52High: 488.54,
    week52Low: 138.8,
    currency: "USD",
  },
  META: {
    symbol: "META",
    name: "Meta Platforms Inc.",
    price: 511.78,
    change: 8.92,
    changePercent: 1.77,
    open: 503.5,
    high: 513.2,
    low: 502.8,
    previousClose: 502.86,
    volume: 14_320_700,
    marketCap: 1_300_000_000_000,
    peRatio: 27.6,
    week52High: 638.4,
    week52Low: 414.5,
    currency: "USD",
  },
};

export function getStockQuote(symbol: string): StockQuote | null {
  const upper = symbol.toUpperCase();
  return mockStocks[upper] ?? null;
}

export function getMultipleStockQuotes(symbols: string[]): StockQuote[] {
  return symbols
    .map((s) => getStockQuote(s))
    .filter((q): q is StockQuote => q !== null);
}
