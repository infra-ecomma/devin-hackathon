import * as vscode from "vscode";
import { TellurionPanel } from './panels/TellurionPanel';
import { ProjectScanner } from './core/ProjectScanner';
import { StateManager } from './core/StateManager';
import { InceptionEngine } from './core/InceptionEngine';
import { BrandingAdapter } from './core/BrandingAdapter';
import { ContextDevClient } from './core/ContextDevClient';
import { ConvexClient } from './core/ConvexClient';
import { Planet } from './types';

let panel: TellurionPanel | undefined;

function toRendererPlanets(planets: Planet[]): any[] {
  return planets.map((p, i) => ({
    id: p.id,
    name: p.name,
    desc: p.description,
    color: p.color,
    orbR: p.orbitRadius || (90 + i * 70),
    spd: p.speed || (0.002 + i * 0.0005),
    angle: p.angle ?? Math.random() * Math.PI * 2,
    size: p.size,
    v: p.verified,
    contextUrl: (p as any).contextUrl,
    contextMarkdown: (p as any).contextMarkdown,
    moons: (p.moons || []).map((m) => ({
      id: m.id,
      name: m.name,
      color: m.color,
      oR: m.orbitR,
      spd: m.speed,
      angle: m.angle ?? Math.random() * Math.PI * 2,
      sz: m.size,
      v: m.verified
    }))
  }));
}

export function activate(ctx: vscode.ExtensionContext) {
  console.log("[Tellurion] Extension active");
  const scanner = new ProjectScanner();
  const inception = new InceptionEngine();
  const brandAdapter = new BrandingAdapter();
  const state = new StateManager(ctx);
  const contextDev = new ContextDevClient();
  const convex = new ConvexClient();
  const output = vscode.window.createOutputChannel("Tellurion Partners");

  const ensurePanel = (): TellurionPanel => {
    if (!panel) panel = new TellurionPanel(ctx, scanner, inception, brandAdapter, state, () => { panel = undefined; });
    return panel;
  };

  const runInception = async (opened: TellurionPanel) => {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders?.length) { vscode.window.showErrorMessage("Tellurion: No workspace folder."); return; }
    const root = folders[0].uri.fsPath;
    const planets = await scanner.scan(root);
    const spine = await inception.run(root);
    const brand = brandAdapter.scan(root);
    state.savePlanets(planets);
    state.saveSpine(spine);
    if (panel === opened) opened.sendMessage({ type:'init', planets: toRendererPlanets(planets), spine, brand });
    vscode.window.showInformationMessage(`Tellurion: ${planets.length} deliverables mapped, ${spine.length} steps tracked.`);
    await convex.addEvent("inception", { root, planets: planets.length, spine: spine.length });
  };

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tellurion.openOrrery', () => {
      ensurePanel().reveal();
    }),
    vscode.commands.registerCommand('tellurion.startInception', async () => {
      const opened = ensurePanel();
      opened.reveal();
      await runInception(opened);
    }),
    vscode.commands.registerCommand('tellurion.refreshScan', async () => {
      if (!panel) { vscode.window.showWarningMessage("Tellurion: Open the orrery first."); return; }
      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) { vscode.window.showErrorMessage("Tellurion: No workspace folder."); return; }
      const planets = await scanner.scan(folders[0].uri.fsPath);
      state.savePlanets(planets);
      panel.sendMessage({ type:'refresh', planets: toRendererPlanets(planets) });
      vscode.window.showInformationMessage(`Tellurion: Refreshed — ${planets.length} deliverables.`);
      await convex.addEvent("refresh", { planets: planets.length });
    }),
    vscode.commands.registerCommand('tellurion.enrichContext', async () => {
      if (!contextDev.enabled()) { vscode.window.showErrorMessage("CONTEXT_DEV_API_KEY not set in environment."); return; }
      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) { vscode.window.showErrorMessage("Tellurion: No workspace folder."); return; }
      const s = state.load();
      const planetNames = (s.planets || []).map((p: Planet) => p.name);
      if (!planetNames.length) { vscode.window.showErrorMessage("Run Inception first."); return; }
      const picked = await vscode.window.showQuickPick(planetNames, { placeHolder: "Pick a planet to enrich" });
      if (!picked) return;
      const url = await vscode.window.showInputBox({ placeHolder: "URL to scrape with Context.dev", value: "https://docs.convex.dev" });
      if (!url) return;
      try {
        const res = await contextDev.scrape(url);
        if (!res) { vscode.window.showWarningMessage("Context.dev returned empty."); return; }
        const p = s.planets.find((x: Planet) => x.name === picked);
        if (!p) return;
        state.setPlanetContext(p.id, res.url, res.markdown.slice(0, 2000));
        panel?.sendMessage({ type:'refresh', planets: toRendererPlanets(state.load().planets) });
        vscode.window.showInformationMessage(`Context.dev enriched ${picked}: ${res.markdown.length} chars.`);
        await convex.addEvent("context-dev", { planet: picked, url: res.url, chars: res.markdown.length });
      } catch (err) {
        vscode.window.showErrorMessage(`Context.dev failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }),
    vscode.commands.registerCommand('tellurion.showEvents', async () => {
      if (!convex.enabled()) { vscode.window.showErrorMessage("CONVEX_URL not set in environment."); return; }
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
        vscode.window.showErrorMessage(`Convex events failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );
}
export function deactivate() {}
