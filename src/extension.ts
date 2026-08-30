// Tellurion, Earned Light. The extension host wires commands, watchers, and
// skin settings to the headless engine. Every state pushed to the sky comes
// from computeVentureState; nothing shown is invented here.
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { execFile } from "child_process";
import { computeVentureState } from "./core/engine";
import { TellurionPanel } from "./panels/TellurionPanel";
import { DEFAULT_STYLE, DEFAULT_THEME, SkinStyle, SkinTheme } from "./types";
import { ContextDevClient } from "./core/ContextDevClient";
import { ConvexClient } from "./core/ConvexClient";

let panel: TellurionPanel | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let commitTimer: ReturnType<typeof setTimeout> | undefined;
let gitWatcher: fs.FSWatcher | undefined;
let contextDev: ContextDevClient;
let convex: ConvexClient;

function workspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function config(): vscode.WorkspaceConfiguration {
  return vscode.workspace.getConfiguration("tellurion");
}

function styleSetting(): SkinStyle {
  return config().get<SkinStyle>("style", DEFAULT_STYLE);
}

function themeSetting(): SkinTheme {
  return config().get<SkinTheme>("theme", DEFAULT_THEME);
}

function resolveTheme(setting: SkinTheme): "dark" | "light" {
  if (setting !== "auto") return setting;
  const kind = vscode.window.activeColorTheme.kind;
  const dark = kind === vscode.ColorThemeKind.Dark || kind === vscode.ColorThemeKind.HighContrast;
  return dark ? "dark" : "light";
}

function effectiveSkin(): { style: SkinStyle; theme: "dark" | "light"; themeSetting: SkinTheme } {
  const setting = themeSetting();
  return { style: styleSetting(), theme: resolveTheme(setting), themeSetting: setting };
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function countCommits(root: string): Promise<number | undefined> {
  return new Promise(resolve => {
    execFile("git", ["rev-list", "--count", "HEAD"], { cwd: root }, (err, stdout) => {
      if (err) { resolve(undefined); return; }
      const n = parseInt(stdout.trim(), 10);
      resolve(Number.isNaN(n) ? undefined : n);
    });
  });
}

function ensurePanel(ctx: vscode.ExtensionContext): TellurionPanel {
  if (!panel) {
    panel = new TellurionPanel(
      ctx,
      {
        root: workspaceRoot,
        skin: effectiveSkin,
        persistSkin: async (style: SkinStyle, theme: SkinTheme) => {
          await config().update("style", style, vscode.ConfigurationTarget.Global);
          await config().update("theme", theme, vscode.ConfigurationTarget.Global);
        }
      },
      () => { panel = undefined; }
    );
  }
  return panel;
}

async function recomputeAndPush(): Promise<void> {
  const root = workspaceRoot();
  const p = panel;
  if (!root || !p) return;
  try {
    p.postState(await computeVentureState(root));
  } catch (e) {
    p.postEvent("error", errorText(e));
  }
}

async function runScan(ctx: vscode.ExtensionContext): Promise<void> {
  const root = workspaceRoot();
  if (!root) {
    vscode.window.showErrorMessage("Tellurion: no workspace folder open, nothing to scan.");
    return;
  }
  const p = ensurePanel(ctx);
  p.reveal();
  void armGitWatcher();
  try {
    // First Light streams: each line lands the moment the engine reaches that
    // milestone, and the sky itself lands only when the state is computed.
    const state = await computeVentureState(root, ev => { p.postEvent(ev.kind, ev.line); });
    p.postEvent(
      "scan",
      `first light: ${state.productsInSky} products in the sky, ${state.productsVerified} verified`
    );
    p.postState(state);
  } catch (e) {
    p.postEvent("error", errorText(e));
  }
}

let watcherWarned = false;

function gitDirOf(root: string): Promise<string | undefined> {
  return new Promise(resolve => {
    execFile("git", ["rev-parse", "--git-dir"], { cwd: root }, (err, stdout) => {
      if (err) { resolve(undefined); return; }
      const dir = stdout.trim();
      resolve(path.isAbsolute(dir) ? dir : path.join(root, dir));
    });
  });
}

async function armGitWatcher(): Promise<void> {
  if (gitWatcher) return;
  const root = workspaceRoot();
  if (!root) return;
  const gitDir = await gitDirOf(root);
  const headLog = gitDir ? path.join(gitDir, "logs", "HEAD") : undefined;
  if (!headLog || !fs.existsSync(headLog)) {
    if (!watcherWarned) {
      watcherWarned = true;
      panel?.postEvent("error", `commit watching unavailable: ${headLog ?? "no git dir"} (focus regain still rescans)`);
    }
    return;
  }
  try {
    gitWatcher = fs.watch(headLog, () => {
      if (commitTimer) clearTimeout(commitTimer);
      commitTimer = setTimeout(() => {
        commitTimer = undefined;
        void onCommitDetected();
      }, 300);
    });
  } catch {
    gitWatcher = undefined;
  }
}

function disarmGitWatcher(): void {
  if (commitTimer) { clearTimeout(commitTimer); commitTimer = undefined; }
  if (gitWatcher) { gitWatcher.close(); gitWatcher = undefined; }
}

async function onCommitDetected(): Promise<void> {
  const root = workspaceRoot();
  const p = panel;
  if (!root || !p) return;
  try {
    const state = await computeVentureState(root);
    p.postEvent("commit", `commit ${state.headSha.slice(0, 7)} on ${state.branch}`);
    p.postState(state);
  } catch (e) {
    p.postEvent("error", errorText(e));
  }
}

export function activate(ctx: vscode.ExtensionContext): void {
  contextDev = new ContextDevClient();
  convex = new ConvexClient();
  const output = vscode.window.createOutputChannel("Tellurion Partners");

  const openSky = () => { ensurePanel(ctx).reveal(); };

  ctx.subscriptions.push(
    vscode.commands.registerCommand("tellurion.openSky", openSky),
    vscode.commands.registerCommand("tellurion.openOrrery", openSky),
    vscode.commands.registerCommand("tellurion.startInception", () => runScan(ctx)),
    vscode.commands.registerCommand("tellurion.refreshScan", () => runScan(ctx)),
    vscode.commands.registerCommand("tellurion.switchStyle", async () => {
      const styles: SkinStyle[] = ["futuristic", "rustic"];
      const pick = await vscode.window.showQuickPick(styles, {
        placeHolder: `Sky style, currently ${styleSetting()}`
      });
      if (pick) await config().update("style", pick, vscode.ConfigurationTarget.Global);
    }),
    vscode.commands.registerCommand("tellurion.switchTheme", async () => {
      const themes: SkinTheme[] = ["dark", "light", "auto"];
      const pick = await vscode.window.showQuickPick(themes, {
        placeHolder: `Sky theme, currently ${themeSetting()}`
      });
      if (pick) await config().update("theme", pick, vscode.ConfigurationTarget.Global);
    }),
    // Context.dev — enrich any planet with scraped context
    vscode.commands.registerCommand("tellurion.enrichContext", async () => {
      if (!contextDev.enabled()) {
        vscode.window.showErrorMessage("CONTEXT_DEV_API_KEY not set in environment.");
        return;
      }
      const root = workspaceRoot();
      if (!root) { vscode.window.showErrorMessage("Tellurion: no workspace folder."); return; }
      let state;
      try { state = await computeVentureState(root); } catch { return; }
      const planetNames = state.products.map(p => p.name);
      if (!planetNames.length) { vscode.window.showErrorMessage("Run Inception first."); return; }
      const picked = await vscode.window.showQuickPick(planetNames, { placeHolder: "Pick a planet to enrich" });
      if (!picked) return;
      const url = await vscode.window.showInputBox({
        placeHolder: "URL to scrape with Context.dev",
        value: "https://docs.convex.dev"
      });
      if (!url) return;
      const p = ensurePanel(ctx);
      try {
        p.postEvent("scan", `Context.dev scraping: ${url}`);
        const res = await contextDev.scrape(url);
        if (!res) { vscode.window.showWarningMessage("Context.dev returned empty."); return; }
        p.postEvent("scan", `Context.dev enriched ${picked}: ${res.markdown.length} chars from ${res.url}`);
        await convex.addEvent("context-dev", { planet: picked, url: res.url, chars: res.markdown.length });
      } catch (err) {
        p.postEvent("error", `Context.dev failed: ${errorText(err)}`);
      }
    }),
    // Convex — show event log
    vscode.commands.registerCommand("tellurion.showEvents", async () => {
      if (!convex.enabled()) {
        vscode.window.showErrorMessage("CONVEX_URL not set in environment.");
        return;
      }
      try {
        const events = await convex.listEvents();
        output.clear();
        output.appendLine(`Convex events (${events.length}):`);
        for (const e of events.slice(0, 20)) {
          const payload = typeof e.payload === "string" ? e.payload.slice(0, 200) : JSON.stringify(e.payload).slice(0, 200);
          output.appendLine(`[${new Date(e.createdAt).toLocaleTimeString()}] ${e.kind}: ${payload}`);
        }
        output.show();
      } catch (err) {
        vscode.window.showErrorMessage(`Convex events failed: ${errorText(err)}`);
      }
    }),

    vscode.workspace.onDidSaveTextDocument(() => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => { saveTimer = undefined; void recomputeAndPush(); }, 800);
    }),

    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration("tellurion.style") || e.affectsConfiguration("tellurion.theme")) {
        panel?.postSkin();
      }
    }),

    vscode.window.onDidChangeActiveColorTheme(() => {
      if (themeSetting() !== "auto") return;
      panel?.postSkin();
    }),

    vscode.window.onDidChangeWindowState(ws => {
      if (ws.focused) void recomputeAndPush();
    }),

    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      disarmGitWatcher();
      void armGitWatcher();
    }),

    new vscode.Disposable(() => {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = undefined; }
      disarmGitWatcher();
    })
  );

  void armGitWatcher();
}

export function deactivate(): void {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = undefined; }
  disarmGitWatcher();
  panel?.dispose();
  panel = undefined;
}
