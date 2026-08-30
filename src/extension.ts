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

let panel: TellurionPanel | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let commitTimer: ReturnType<typeof setTimeout> | undefined;
let gitWatcher: fs.FSWatcher | undefined;

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

function ensurePanel(ctx: vscode.ExtensionContext): TellurionPanel {
  // A closed tab disposes the panel; a kept stale reference would make every
  // later command post into a dead webview, so the ref drops on dispose.
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
  // In a linked worktree .git is a FILE pointing at the real git dir, so the
  // reflog must be resolved through git itself rather than assumed at .git/.
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
      // git touches the reflog more than once per commit; coalesce to one push
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
  if (commitTimer) {
    clearTimeout(commitTimer);
    commitTimer = undefined;
  }
  if (gitWatcher) {
    gitWatcher.close();
    gitWatcher = undefined;
  }
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
  const openSky = () => { ensurePanel(ctx).reveal(); };

  ctx.subscriptions.push(
    vscode.commands.registerCommand("tellurion.openSky", openSky),
    vscode.commands.registerCommand("tellurion.openOrrery", openSky),
    vscode.commands.registerCommand("tellurion.startInception", () => runScan(ctx)),
    vscode.commands.registerCommand("tellurion.refreshScan", () => runScan(ctx)),
    vscode.commands.registerCommand("tellurion.switchStyle", async () => {
      const styles: SkinStyle[] = ["rustic", "futuristic"];
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

    vscode.workspace.onDidSaveTextDocument(() => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        saveTimer = undefined;
        void recomputeAndPush();
      }, 800);
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
      // A worktree or an unwatchable git dir can miss commits; a focus regain
      // is the cheap moment to re-earn the truth.
      if (ws.focused) void recomputeAndPush();
    }),

    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      disarmGitWatcher();
      void armGitWatcher();
    }),

    new vscode.Disposable(() => {
      if (saveTimer) {
        clearTimeout(saveTimer);
        saveTimer = undefined;
      }
      disarmGitWatcher();
    })
  );

  void armGitWatcher();
}

export function deactivate(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
  disarmGitWatcher();
  panel?.dispose();
  panel = undefined;
}
