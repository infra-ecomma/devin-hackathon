import * as vscode from "vscode";

export interface ConvexEvent {
  _id?: string;
  _creationTime?: number;
  kind: string;
  payload: string;
  createdAt: number;
}

export class ConvexClient {
  private client: any;

  constructor(private url?: string) {
    this.url = url || process.env.CONVEX_URL;
  }

  enabled(): boolean {
    return !!this.url;
  }

  private async ensureClient(): Promise<any> {
    if (this.client) return this.client;
    if (!this.url) throw new Error("CONVEX_URL not set");
    const mod = await import("convex/browser");
    this.client = new mod.ConvexHttpClient(this.url);
    return this.client;
  }

  async addEvent(kind: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const c = await this.ensureClient();
      await c.mutation("events/add", { kind, payload: JSON.stringify(payload) });
    } catch (err) {
      vscode.window.showWarningMessage(`Convex push failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async listEvents(): Promise<ConvexEvent[]> {
    const c = await this.ensureClient();
    return c.query("events/listLatest");
  }
}
