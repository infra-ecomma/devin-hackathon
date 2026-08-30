#!/usr/bin/env node
// Invite-walk — the executable definition of done for F2 (auto-open, where
// invited), ruled 2026-08-30: the instrument used to surface in every window;
// now it opens only where the project carries .tellurion/ state or the operator
// has opened it once in that workspace.
//
// The vscode API is stubbed and the real open path is deliberately aborted one
// layer past the invite bookkeeping, so this walk starts no servers.
// Exit code is the number of failures.

import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';

const require = Module.createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));

const steps = [];
const ok = (name, cond, detail = '') => {
  steps.push({ name, ok: !!cond });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${String(steps.length).padStart(2, '0')}  ${name}${detail ? '  :: ' + detail : ''}`);
};

function runActivation(rootPath, seed = {}) {
  const ctx = {
    subscriptions: [],
    workspaceState: { data: { ...seed }, get(k) { return this.data[k]; }, async update(k, v) { this.data[k] = v; } },
  };
  const calls = { setContext: [], commands: {}, statusShown: 0 };
  const vscode = {
    commands: {
      registerCommand: (id, fn) => { calls.commands[id] = fn; return { dispose() {} }; },
      executeCommand: async (id, ...a) => { if (id === 'setContext') calls.setContext.push(a); },
    },
    window: {
      activeTextEditor: undefined,
      registerWebviewViewProvider: () => ({ dispose() {} }),
      createStatusBarItem: () => ({ text: '', tooltip: '', command: '', show() { calls.statusShown++; } }),
      showWarningMessage: () => {}, showErrorMessage: () => {}, showInformationMessage: () => {},
      withProgress: async () => { throw new Error('walk-abort-open'); },
    },
    workspace: { workspaceFolders: rootPath ? [{ uri: { fsPath: rootPath } }] : [] },
    env: { asExternalUri: async (u) => u },
    Uri: { parse: (s) => ({ toString: () => s }) },
    ViewColumn: { Beside: -2 }, ProgressLocation: { Notification: 15 }, StatusBarAlignment: { Right: 2 },
  };
  const origLoad = Module._load;
  Module._load = function (req, ...rest) {
    if (req === 'vscode') return vscode;
    return origLoad.call(this, req, ...rest);
  };
  const extPath = path.join(HERE, '..', 'vscode-ext', 'extension.js');
  delete require.cache[extPath];
  const ext = require(extPath);
  let activationErr = null;
  try { ext.activate(ctx); } catch (e) { activationErr = e; }
  finally { Module._load = origLoad; }
  return { ctx, calls, activationErr, openHandler: calls.commands['tellurion.open'] };
}

(async () => {
  // I1: a project carrying Tellurion state is invited at activation.
  const invited = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-yes-'));
  fs.mkdirSync(path.join(invited, '.tellurion'));
  let r = runActivation(invited);
  ok('I1 a project with .tellurion/ is invited on activation',
     !r.activationErr && r.calls.setContext.some(([k, v]) => k === 'tellurion.invited' && v === true),
     JSON.stringify(r.calls.setContext));

  // I2/I3: a project without it activates quietly, but the status bar door stays.
  const quiet = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-no-'));
  r = runActivation(quiet);
  ok('I2 a project without Tellurion state is not invited',
     !r.activationErr && r.calls.setContext.some(([k, v]) => k === 'tellurion.invited' && v === false));
  ok('I3 the status bar stays as the one-click door', r.calls.statusShown === 1);

  // I4: opening the panel records the invite before anything server-side runs.
  let threw = null;
  try { await r.openHandler(); } catch (e) { threw = e.message; }
  ok('I4 opening the panel once records the invite and flips the context',
     threw === 'walk-abort-open' && r.ctx.workspaceState.data['tellurion.openedOnce'] === true
     && r.calls.setContext.at(-1)[0] === 'tellurion.invited' && r.calls.setContext.at(-1)[1] === true);

  // I5: a later window of the same workspace is invited by the recorded open.
  const r5 = runActivation(quiet, { 'tellurion.openedOnce': true });
  ok('I5 the recorded invite carries to the next window',
     !r5.activationErr && r5.calls.setContext.some(([k, v]) => k === 'tellurion.invited' && v === true));

  const fails = steps.filter((s) => !s.ok).length;
  fs.rmSync(invited, { recursive: true, force: true });
  fs.rmSync(quiet, { recursive: true, force: true });
  console.log(`\n${steps.length - fails}/${steps.length} invite-walk steps passed`);
  process.exit(fails);
})();
