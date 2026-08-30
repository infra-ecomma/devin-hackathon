import * as vscode from "vscode";
import { TellurionPanel } from './panels/TellurionPanel';
import { ProjectScanner } from './core/ProjectScanner';
import { StateManager } from './core/StateManager';
import { InceptionEngine } from './core/InceptionEngine';
import { BrandingAdapter } from './core/BrandingAdapter';

let panel: TellurionPanel | undefined;

export function activate(ctx: vscode.ExtensionContext) {
  console.log("[Tellurion] Extension active");
  const scanner = new ProjectScanner();
  const inception = new InceptionEngine();
  const brandAdapter = new BrandingAdapter();

  ctx.subscriptions.push(
    vscode.commands.registerCommand('tellurion.openOrrery', () => {
      if (!panel) panel = new TellurionPanel(ctx, scanner, inception, brandAdapter);
      panel.reveal();
    }),
    vscode.commands.registerCommand('tellurion.startInception', async () => {
      if (!panel) panel = new TellurionPanel(ctx, scanner, inception, brandAdapter);
      panel.reveal();
      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) { vscode.window.showErrorMessage("Tellurion: No workspace folder."); return; }
      const root = folders[0].uri.fsPath;
      const planets = await scanner.scan(root);
      const spine = await inception.run(root);
      const brand = brandAdapter.scan(root);
      panel!.sendMessage({ type:'init', planets, spine, brand });
      vscode.window.showInformationMessage(`Tellurion: ${planets.length} deliverables mapped, ${spine.length} steps tracked.`);
    }),
    vscode.commands.registerCommand('tellurion.refreshScan', async () => {
      const folders = vscode.workspace.workspaceFolders;
      if (!folders?.length) { vscode.window.showErrorMessage("Tellurion: No workspace folder."); return; }
      const planets = await scanner.scan(folders[0].uri.fsPath);
      panel?.sendMessage({ type:'refresh', planets });
      vscode.window.showInformationMessage(`Tellurion: Refreshed — ${planets.length} deliverables.`);
    })
  );
}
export function deactivate() {}
