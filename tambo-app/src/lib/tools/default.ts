import {
    getCountryPopulations,
    getGlobalPopulationTrend,
} from "@/services/population-stats";
import { getMultipleStockQuotes, getStockQuote } from "@/services/stocks-data";
import { z } from "zod";

export const defaultTools = [
    {
        name: "countryPopulation",
        description:
            "A tool to get population statistics by country with advanced filtering options",
        tool: getCountryPopulations,
        inputSchema: z.object({
            continent: z.string().optional(),
            sortBy: z.enum(["population", "growthRate"]).optional(),
            limit: z.number().optional(),
            order: z.enum(["asc", "desc"]).optional(),
        }),
        outputSchema: z.array(
            z.object({
                countryCode: z.string(),
                countryName: z.string(),
                continent: z.enum([
                    "Asia",
                    "Africa",
                    "Europe",
                    "North America",
                    "South America",
                    "Oceania",
                ]),
                population: z.number(),
                year: z.number(),
                growthRate: z.number(),
            }),
        ),
    },
    {
        name: "globalPopulation",
        description:
            "A tool to get global population trends with optional year range filtering",
        tool: getGlobalPopulationTrend,
        inputSchema: z.object({
            startYear: z.number().optional(),
            endYear: z.number().optional(),
        }),
        outputSchema: z.array(
            z.object({
                year: z.number(),
                population: z.number(),
                growthRate: z.number(),
            }),
        ),
    },
    {
        name: "get-available-ingredients",
        description:
            "Get a list of all the available ingredients that can be used in a recipe.",
        tool: () => [
            "pizza dough",
            "mozzarella cheese",
            "tomatoes",
            "basil",
            "olive oil",
            "chicken breast",
            "ground beef",
            "onions",
            "garlic",
            "bell peppers",
            "mushrooms",
            "pasta",
            "rice",
            "eggs",
            "bread",
        ],
        inputSchema: z.object({}),
        outputSchema: z.array(z.string()),
    },
    {
        name: "getStockQuote",
        description:
            "Get a stock quote for a single ticker symbol. Returns price, change, volume, market cap, P/E ratio, and 52-week range.",
        tool: ({ symbol }: { symbol: string }) => getStockQuote(symbol),
        inputSchema: z.object({
            symbol: z.string().describe("Stock ticker symbol, e.g. AAPL"),
        }),
        outputSchema: z.object({
            symbol: z.string(),
            name: z.string(),
            price: z.number(),
            change: z.number(),
            changePercent: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            previousClose: z.number(),
            volume: z.number(),
            marketCap: z.number(),
            peRatio: z.number().nullable(),
            week52High: z.number(),
            week52Low: z.number(),
            currency: z.string(),
        }).nullable(),
    },
    {
        name: "getMultipleStockQuotes",
        description:
            "Get stock quotes for multiple ticker symbols at once. Returns price, change, volume, market cap, P/E ratio, and 52-week range for each.",
        tool: ({ symbols }: { symbols: string[] }) => getMultipleStockQuotes(symbols),
        inputSchema: z.object({
            symbols: z.array(z.string()).describe("List of stock ticker symbols, e.g. [\"AAPL\", \"MSFT\"]"),
        }),
        outputSchema: z.array(z.object({
            symbol: z.string(),
            name: z.string(),
            price: z.number(),
            change: z.number(),
            changePercent: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            previousClose: z.number(),
            volume: z.number(),
            marketCap: z.number(),
            peRatio: z.number().nullable(),
            week52High: z.number(),
            week52Low: z.number(),
            currency: z.string(),
        })),
    },
];