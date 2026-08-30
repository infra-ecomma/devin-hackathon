// The sky panel. It owns the webview message loop; every fact it shows comes
// from the engine, and every engine failure surfaces as an "error" log line.
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { computeVentureState, runCheck, revoke } from "../core/engine";
import {
  FromWebview,
  ScanEvent,
  SkinStyle,
  SkinTheme,
  ToWebview,
  VentureState
} from "../types";

export interface PanelHost {
  root(): string | undefined;
  skin(): { style: SkinStyle; theme: "dark" | "light"; themeSetting: SkinTheme };
  persistSkin(style: SkinStyle, theme: SkinTheme): Promise<void>;
}

function errText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export class TellurionPanel {
  private readonly panel: vscode.WebviewPanel;
  private disposed = false;

  constructor(
    private readonly ctx: vscode.ExtensionContext,
    private readonly host: PanelHost,
    private readonly onDisposed: () => void
  ) {
    this.panel = vscode.window.createWebviewPanel(
      "tellurion.sky",
      "Tellurion Sky",
      vscode.ViewColumn.Two,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [ctx.extensionUri]
      }
    );
    this.panel.webview.html = this.loadHtml();
    this.panel.webview.onDidReceiveMessage((msg: FromWebview) => { void this.handle(msg); });
    this.panel.onDidDispose(() => {
      this.disposed = true;
      this.onDisposed();
    });
  }

  reveal(): void {
    this.panel.reveal(vscode.ViewColumn.Two);
  }

  postState(state: VentureState): void {
    const skin = this.host.skin();
    this.post({ type: "state", state, style: skin.style, theme: skin.theme, themeSetting: skin.themeSetting });
  }

  postSkin(): void {
    const skin = this.host.skin();
    this.post({ type: "skin", style: skin.style, theme: skin.theme, themeSetting: skin.themeSetting });
  }

  postEvent(kind: ScanEvent["kind"], line: string): void {
    this.post({ type: "event", event: { at: new Date().toISOString(), kind, line } });
  }

  dispose(): void {
    if (!this.disposed) this.panel.dispose();
  }

  private post(msg: ToWebview): void {
    if (this.disposed) return;
    void this.panel.webview.postMessage(msg);
  }

  private async handle(msg: FromWebview): Promise<void> {
    switch (msg.type) {
      case "ready":
      case "refresh":
        await this.refreshState();
        return;
      case "runCheck":
        await this.runTarget(msg.productId, msg.featureId);
        return;
      case "runWalk":
        await this.runTarget(msg.productId, "__walk__");
        return;
      case "revoke":
        await this.revokeTarget(msg.productId, msg.featureId);
        return;
      case "setSkin":
        await this.applySkin(msg.style, msg.theme);
        return;
      case "openPath":
        await this.openPath(msg.path);
        return;
    }
  }

  private async refreshState(): Promise<void> {
    const root = this.host.root();
    if (!root) {
      this.postEvent("error", "no workspace folder open");
      return;
    }
    try {
      this.postState(await computeVentureState(root));
    } catch (e) {
      this.postEvent("error", errText(e));
    }
  }

  private async runTarget(productId: string, featureId: string): Promise<void> {
    const root = this.host.root();
    if (!root) {
      this.postEvent("error", "no workspace folder open");
      return;
    }
    const target = `${productId}/${featureId}`;
    this.post({ type: "checking", target });
    try {
      const record = await runCheck(root, productId, featureId);
      this.postEvent("check", `${target} ran ${record.command} and exited ${record.exitCode}`);
      if (featureId === "__walk__" && record.exitCode === 0) {
        this.postEvent("verify", `walk exit 0 recorded for ${productId}`);
      }
    } catch (e) {
      this.postEvent("error", errText(e));
    }
    await this.refreshState();
  }

  private async revokeTarget(productId: string, featureId: string): Promise<void> {
    const root = this.host.root();
    if (!root) {
      this.postEvent("error", "no workspace folder open");
      return;
    }
    try {
      await revoke(root, productId, featureId);
      this.postEvent("revoke", `revoked ${productId}/${featureId}, light returns to unproven`);
    } catch (e) {
      this.postEvent("error", errText(e));
    }
    await this.refreshState();
  }

  private async applySkin(style: SkinStyle, theme: SkinTheme): Promise<void> {
    try {
      await this.host.persistSkin(style, theme);
    } catch (e) {
      this.postEvent("error", errText(e));
    }
    this.postSkin();
  }

  private async openPath(rel: string): Promise<void> {
    const root = this.host.root();
    if (!root) {
      this.postEvent("error", "no workspace folder open");
      return;
    }
    // The webview is a trust boundary; a relative path must stay inside root.
    const abs = path.resolve(root, rel);
    if (abs !== root && !abs.startsWith(root + path.sep)) {
      this.postEvent("error", `path escapes the workspace: ${rel}`);
      return;
    }
    let isDirectory: boolean;
    try {
      isDirectory = fs.statSync(abs).isDirectory();
    } catch {
      this.postEvent("error", `path not found: ${rel}`);
      return;
    }
    try {
      if (isDirectory) {
        await vscode.commands.executeCommand("revealInExplorer", vscode.Uri.file(abs));
      } else {
        const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(abs));
        await vscode.window.showTextDocument(doc, { preview: true });
      }
    } catch (e) {
      this.postEvent("error", errText(e));
    }
  }

  private loadHtml(): string {
    const file = path.join(this.ctx.extensionUri.fsPath, "media", "tellurion.html");
    try {
      return fs.readFileSync(file, "utf-8");
    } catch (e) {
      return [
        "<!DOCTYPE html><html><body style=\"font-family:system-ui;padding:2rem\">",
        "<h2>Tellurion</h2>",
        `<p>media/tellurion.html could not be loaded: ${escapeHtml(errText(e))}</p>`,
        "</body></html>"
      ].join("");
    }
  }
}
