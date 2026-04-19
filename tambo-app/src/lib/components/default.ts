import RecipeCard from "@/components/recipe-card";
import { Graph, graphSchema } from "@/components/tambo/graph";
import { StockCard, stockCardSchema } from "@/components/tambo/stock-card";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import { z } from "zod";

export const defaultComponents = [
    {
        name: "Graph",
        description:
            "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options.",
        component: Graph,
        propsSchema: graphSchema,
    },
    {
        name: "DataCard",
        description:
            "A component that displays options as clickable cards with links and summaries with the ability to select multiple items.",
        component: DataCard,
        propsSchema: dataCardSchema,
    },
    {
        name: "StockCard",
        description:
            "A component that displays a stock quote card with price, change, volume, market cap, P/E ratio, and 52-week range. Use when the user asks about a specific stock or share price.",
        component: StockCard,
        propsSchema: stockCardSchema,
    },
    {
        name: "RecipeCard",
        description: "A component that renders a recipe card",
        component: RecipeCard,
        propsSchema: z.object({
            title: z.string().describe("The title of the recipe"),
            description: z.string().describe("The description of the recipe"),
            prepTime: z.number().describe("The prep time of the recipe in minutes"),
            cookTime: z.number().describe("The cook time of the recipe in minutes"),
            originalServings: z
                .number()
                .describe("The original servings of the recipe"),
            ingredients: z
                .array(
                    z.object({
                        name: z.string().describe("The name of the ingredient"),
                        amount: z.number().describe("The amount of the ingredient"),
                        unit: z.string().describe("The unit of the ingredient"),
                    })
                )
                .describe("The ingredients of the recipe"),
        }),
    },
];