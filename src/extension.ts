import * as vscode from "vscode";
import { TellurionPanel } from './panels/TellurionPanel';
import { ProjectScanner } from './core/ProjectScanner';
import { StateManager } from './core/StateManager';
import { InceptionEngine } from './core/InceptionEngine';
import { BrandingAdapter } from './core/BrandingAdapter';
import { Planet, Moon } from './types';

let panel: TellurionPanel | undefined;

// The webview renderer uses a compact field naming that predates the TS types.
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
    })
  );
}
export function deactivate() {}
