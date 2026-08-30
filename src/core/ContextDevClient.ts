import { Planet } from "../types";

export interface ContextDevResult {
  markdown: string;
  url: string;
}

export class ContextDevClient {
  private base = "https://api.context.dev/v1/web";
  private key: string | undefined;

  constructor() {
    this.key = process.env.CONTEXT_DEV_API_KEY;
  }

  enabled(): boolean {
    return !!this.key;
  }

  async scrape(url: string): Promise<ContextDevResult | null> {
    if (!this.key) {
      throw new Error("CONTEXT_DEV_API_KEY not set");
    }
    const u = new URL(`${this.base}/scrape/markdown`);
    u.searchParams.set("url", url);
    const res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${this.key}` },
    });
    if (!res.ok) {
      throw new Error(`Context.dev scrape failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json() as { success?: boolean; markdown?: string };
    if (!json.success || !json.markdown) return null;
    return { url, markdown: json.markdown };
  }

  /** Pick a useful URL for a planet: its own README if it looks like a path, or a docs/competitor URL. */
  guessUrl(planet: Planet, root?: string): string | undefined {
    const lower = planet.name.toLowerCase();
    if (lower.includes("readme") && root) return `file://${root}/README.md`;
    if (lower.startsWith("http")) return planet.name;
    return undefined;
  }
}
