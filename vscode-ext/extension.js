// Tellurion, as a VS Code panel.
//
// The instrument is already a served page, so this is deliberately thin: it
// finds the server that is already watching THIS workspace folder, starts one if
// none is, and shows it in a webview beside the code. There is no project picker
// anywhere in it, because the window you are in IS the project.
//
// One instance per folder is the whole contract. Opening the command twice
// reveals the existing panel rather than starting a second server, and a second
// VS Code window on a different folder gets its own.
//
// Two machines, and the panel spans both. The extension runs where the PROJECT
// is (Forge, over Remote-SSH), because that is the only place it can find or
// start a server. The webview renders where the EDITOR is (Legion), so a frame
// pointing at 127.0.0.1 would resolve on Legion, where the instrument is not.
//
// vscode.env.asExternalUri is the bridge: it hands back a URI the CLIENT can
// reach, forwarding the remote port when there is a remote and returning the
// address unchanged when there is not. Without it this panel is blank on every
// Remote-SSH window, which is the shape this extension is normally used in.

const vscode = require('vscode');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { wrapperHtml } = require('./wrapper.js');

const panels = new Map();   // folder -> WebviewPanel
const spawned = new Map();  // folder -> { proc, port }

const cfg = () => vscode.workspace.getConfiguration('tellurion');

function folderOf() {
  const fs_ = vscode.workspace.workspaceFolders;
  if (!fs_ || !fs_.length) return null;
  const active = vscode.window.activeTextEditor;
  if (active) {
    const f = vscode.workspace.getWorkspaceFolder(active.document.uri);
    if (f) return f.uri.fsPath;
  }
  return fs_[0].uri.fsPath;
}

function readKey() {
  try { return fs.readFileSync(path.join(os.homedir(), '.tellurion', 'key'), 'utf8').trim(); } catch { return ''; }
}

// A port is "ours" only if the server there is watching the same root. Matching
// on "something answered" would attach the panel to another project's plate,
// which is the one mistake this extension exists to make impossible.
function health(port, timeoutMs = 700) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: '/health', timeout: timeoutMs }, (res) => {
      let b = '';
      res.on('data', (c) => { b += c; });
      res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } });
    });
    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });
  });
}

const sameRoot = (a, b) => a && b && path.resolve(a) === path.resolve(b);

async function findServing(root, [lo, hi]) {
  for (let p = lo; p <= hi; p++) {
    const h = await health(p);
    if (h && h.ok && sameRoot(h.root, root)) return p;
  }
  return null;
}

async function findFreePort([lo, hi]) {
  for (let p = lo; p <= hi; p++) if (!(await health(p, 400))) return p;
  return null;
}

function resolveServer(root) {
  const set = cfg().get('serverPath');
  if (set && fs.existsSync(set)) return set;
  const inWorkspace = path.join(root, 'live-artifact', 'server.mjs');
  if (fs.existsSync(inWorkspace)) return inWorkspace;
  const canonical = path.join(os.homedir(), 'projects', 'Organizing-Claude-Code', 'live-artifact', 'server.mjs');
  return fs.existsSync(canonical) ? canonical : null;
}

async function ensureServer(root) {
  const range = cfg().get('portRange') || [8769, 8788];
  const already = await findServing(root, range);
  if (already) return { port: already, started: false };
  if (!cfg().get('autoStart')) return { port: null, started: false, why: 'autoStart is off' };

  const server = resolveServer(root);
  if (!server) return { port: null, started: false, why: 'could not find live-artifact/server.mjs (set tellurion.serverPath)' };

  // Two windows opened at once probe the same port as free and both spawn; the
  // loser exits EADDRINUSE and the old code then reported "did not come up in
  // 10s" with a range full of free ports. Pick again once before giving up.
  for (let attempt = 0; attempt < 2; attempt++) {
    const port = await findFreePort(range);
    if (!port) return { port: null, started: false, why: `no free port in ${range[0]}-${range[1]}` };

    // A failed boot's own stderr is the only diagnostics it has, and stdio:
    // 'ignore' deleted them — every failure read identically, reason unknown.
    const logFile = path.join(os.tmpdir(), `tellurion-${port}.log`);
    let out = null;
    try { out = fs.openSync(logFile, 'a'); } catch {}
    const proc = spawn(process.execPath, [server, '--project', root, '--name', path.basename(root), '--port', String(port)], {
      cwd: path.dirname(path.dirname(server)),
      detached: true,
      stdio: out ? ['ignore', out, out] : 'ignore',
    });
    proc.unref();
    spawned.set(root, { proc, port });

    // Wait for it to answer for THIS root rather than assuming the spawn worked.
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 250));
      const h = await health(port);
      if (h && h.ok && sameRoot(h.root, root)) return { port, started: true };
      if (proc.exitCode !== null) break;   // a dead process never will
    }
    spawned.delete(root);
    if (proc.exitCode === null) { try { process.kill(-proc.pid); } catch {} }
    // The race's winner may be serving this very root by now.
    const won = await findServing(root, range);
    if (won) return { port: won, started: false };
    if (attempt === 0) continue;
    const tail = (() => { try { return fs.readFileSync(logFile, 'utf8').trim().split('\n').slice(-4).join(' | '); } catch { return ''; } })();
    return { port: null, started: false, why: `the instrument did not come up in 10s${tail ? ` — log says: ${tail.slice(0, 300)}` : ''} (full log: ${logFile})` };
  }
}

// The panel frames the served page through the guard page in wrapper.js, which
// verifies the instrument answers and is watching THIS folder before framing it,
// and names the failure (unreachable, or another project's instrument on the
// port) instead of rendering a blank square. The open-external bridge lives in
// the wrapper too: a target=_blank click inside the nested frame goes nowhere,
// so the page asks us and we ask the host.

// One handler for the panel and one for the sidebar view; both run the same html().
function wireBridge(webview) {
  webview.onDidReceiveMessage((m) => {
    if (m && m.type === 'open' && typeof m.href === 'string' && /^https?:\/\//.test(m.href)) {
      vscode.env.openExternal(vscode.Uri.parse(m.href));
    }
  });
}

async function open() {
  const root = folderOf();
  if (!root) {
    vscode.window.showWarningMessage('Tellurion: open a folder first. The instrument follows one project.');
    return;
  }
  const existing = panels.get(root);
  if (existing) { existing.reveal(vscode.ViewColumn.Beside); return; }

  const res = await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Tellurion: starting on ${path.basename(root)}` },
    () => ensureServer(root),
  );
  if (!res.port) {
    vscode.window.showErrorMessage(`Tellurion could not start: ${res.why}`);
    return;
  }

  const key = readKey();
  // Resolve to something the EDITOR's machine can load, not something this
  // process can load. On Remote-SSH these are different computers.
  let base = `http://127.0.0.1:${res.port}/`;
  try {
    const ext = await vscode.env.asExternalUri(vscode.Uri.parse(base));
    base = ext.toString();
  } catch { /* no remote, or an older API: the loopback address is already right */ }
  if (!base.endsWith('/')) base += '/';
  const origin = base.replace(/\/[^/]*$/, '');
  const url = `${base}${key ? '?k=' + encodeURIComponent(key) : ''}`;
  const panel = vscode.window.createWebviewPanel('tellurion', `Tellurion · ${path.basename(root)}`,
    vscode.ViewColumn.Beside, { enableScripts: true, retainContextWhenHidden: true });
  panel.webview.html = wrapperHtml({ frameUrl: url, origin, expectedRoot: root });
  wireBridge(panel.webview);
  panels.set(root, panel);
  panel.onDidDispose(() => panels.delete(root));
}

function stop() {
  const root = folderOf();
  if (!root) return;
  const p = panels.get(root);
  if (p) p.dispose();
  const s = spawned.get(root);
  if (s && s.proc && s.proc.pid) {
    try { process.kill(-s.proc.pid); } catch { try { process.kill(s.proc.pid); } catch {} }
    spawned.delete(root);
    vscode.window.showInformationMessage('Tellurion: stopped the instrument this window started.');
  } else {
    vscode.window.showInformationMessage('Tellurion: the panel is closed. The instrument was not started by this window, so it is left running.');
  }
}

// The instrument, rendered INSIDE the sidebar view. Same page as the panel, so
// there is one implementation and not two that can disagree.
class SideView {
  constructor() { this.view = null; }
  async resolveWebviewView(view) {
    this.view = view;
    view.webview.options = { enableScripts: true };
    wireBridge(view.webview);
    const root = folderOf();
    if (!root) { view.webview.html = shell('Open a folder to see its instrument.'); return; }
    view.webview.html = shell('Starting the instrument for ' + require('path').basename(root) + '…');
    try {
      const res = await ensureServer(root);
      if (!res || !res.port) { view.webview.html = shell('No instrument for this folder, and none could be started.'); return; }
      const key = readKey();
      let base = `http://127.0.0.1:${res.port}/`;
      try { base = (await vscode.env.asExternalUri(vscode.Uri.parse(base))).toString(); } catch {}
      if (!base.endsWith('/')) base += '/';
      view.webview.html = wrapperHtml({ frameUrl: `${base}${key ? '?k=' + encodeURIComponent(key) : ''}`, origin: base.replace(/\/[^/]*$/, ''), expectedRoot: root });
    } catch (e) {
      view.webview.html = shell('Tellurion could not start: ' + String(e && e.message || e));
    }
  }
}

// A plain message page, for the states where there is no instrument to frame.
function shell(msg) {
  return `<!doctype html><meta charset="utf-8">
<style>body{margin:0;padding:18px;font:13px/1.6 system-ui,sans-serif;color:#8a93a6}</style>
<body>${String(msg).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</body>`;
}

function activate(context) {
  // F2 (auto-open where invited), operator ruling 2026-08-30: the instrument
  // surfaced in every window, so a project that has nothing to do with Tellurion
  // met a panel asking it to declare a plan. It now opens only where the project
  // carries Tellurion state (.tellurion/) or where the operator has opened it
  // once in this workspace; elsewhere the Activity Bar view stays hidden and
  // nothing is started, while the status bar stays available as the one-click
  // invite. Opening the panel records the invite for later windows.
  const root = folderOf();
  const isInvited = () => !!root && (fs.existsSync(path.join(root, '.tellurion'))
    || context.workspaceState.get('tellurion.openedOnce') === true);
  const setInvited = (v) => vscode.commands.executeCommand('setContext', 'tellurion.invited', v).then(undefined, () => {});
  setInvited(isInvited());
  context.subscriptions.push(
    vscode.commands.registerCommand('tellurion.open', async () => {
      if (root) { await context.workspaceState.update('tellurion.openedOnce', true); setInvited(true); }
      return open();
    }),
    vscode.commands.registerCommand('tellurion.stop', stop),
    vscode.window.registerWebviewViewProvider('tellurion.panel', new SideView(), {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );
  // A permanent, clickable surface. Two commands and nothing else meant there was
  // nothing on screen to find, which is exactly what he reported three times.
  const bar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  bar.text = '$(circuit-board) Tellurion';
  bar.tooltip = 'Open the instrument for this project';
  bar.command = 'tellurion.open';
  bar.show();
  context.subscriptions.push(bar);
}
function deactivate() {
  for (const [, s] of spawned) { try { process.kill(-s.proc.pid); } catch {} }
}
module.exports = { activate, deactivate };
