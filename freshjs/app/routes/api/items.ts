import { type Handlers } from "$fresh/server.ts";

export interface Item {
  id: number;
  text: string;
  addedAt: string;
}

// Module-level state — persists for the life of the Deno process (POC only)
const items: Item[] = [
  { id: 1, text: "Fresh JS island architecture", addedAt: new Date().toISOString() },
  { id: 2, text: "Preact Signals in islands", addedAt: new Date().toISOString() },
  { id: 3, text: "Zero JS by default", addedAt: new Date().toISOString() },
];

export const handler: Handlers = {
  GET(_req) {
    return Response.json(items);
  },

  async POST(req) {
    const body = await req.json() as { text: string };
    if (!body.text?.trim()) {
      return Response.json({ error: "text required" }, { status: 400 });
    }
    const item: Item = {
      id: Date.now(),
      text: body.text.trim(),
      addedAt: new Date().toISOString(),
    };
    items.push(item);
    return Response.json(items, { status: 201 });
  },
};
