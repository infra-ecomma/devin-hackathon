// The guard page the panel and sidebar wrap around the instrument.
//
// The 2026-08-29/30 failure this exists to kill: an iframe pointed at a server
// that is not there renders as a BLANK WHITE SQUARE with no diagnosis, and the
// operator reported "the panel does not appear" three times across two sessions
// before the cause (a frame resolving on the wrong machine) was found. A blank
// panel is never acceptable again: this page checks the instrument before it
// frames it, and every failure state names what failed and what to do.
//
// Three end states:
//   ok        — the instrument answers /health and watches THIS folder: frame it.
//   mismatch  — something answers, but it is another project's instrument (the
//               2026-08-28 port-thief escape): say so, name both projects.
//   unreachable — nothing answers: name the URL and the one action that fixes it.
//
// No vscode import here on purpose: this module is also loaded by
// verify/panel-walk.mjs in plain Node, so the page the walk asserts on is
// byte-identical to the page the panel renders.

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function wrapperHtml({ frameUrl, origin, expectedRoot }) {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; frame-src ${origin}; connect-src ${origin}; style-src 'unsafe-inline'; script-src 'unsafe-inline';"/>
<style>
  html,body{margin:0;padding:0;height:100%;background:#F5F7FB;font:13px/1.6 system-ui,sans-serif;color:#2a3350}
  iframe{border:0;width:100%;height:100vh;display:block}
  .card{max-width:460px;margin:14vh auto 0;padding:22px 26px;background:#fff;border:1px solid #dfe5f0;border-radius:10px}
  .card h2{margin:0 0 8px;font-size:15px}
  .card p{margin:6px 0}
  .card code{background:#eef1f7;padding:1px 5px;border-radius:4px;font-size:12px;word-break:break-all}
  .muted{color:#8a93a6}
  .spin{display:inline-block;width:11px;height:11px;border:2px solid #c6cede;border-top-color:#0077FF;border-radius:50%;animation:sp .8s linear infinite;vertical-align:-1px;margin-right:8px}
  @keyframes sp{to{transform:rotate(360deg)}}
  [hidden]{display:none!important}
</style>
</head><body>

<div class="card" id="connecting"><h2><span class="spin"></span>Connecting to the instrument…</h2>
<p class="muted">${esc(origin)}</p></div>

<div class="card" id="unreachable" hidden><h2>The instrument is not answering</h2>
<p>Nothing is serving <code id="uUrl"></code> — the server stopped, or this window's connection to the machine running it dropped.</p>
<p>Run <b>Tellurion: Open the instrument</b> from the command palette. It finds or restarts the server for this folder.</p></div>

<div class="card" id="mismatch" hidden><h2>This port is serving a different project</h2>
<p>The instrument at <code id="mUrl"></code> is watching <code id="mGot"></code>, not this folder (<code id="mWant"></code>).</p>
<p>Run <b>Tellurion: Open the instrument</b> — it will find or start the right one.</p></div>

<script>
(function () {
  var ORIGIN = ${JSON.stringify(origin)};
  var FRAME = ${JSON.stringify(frameUrl)};
  var WANT = ${JSON.stringify(expectedRoot)};
  var norm = function (s) { return String(s || '').replace(/\\/+$/, ''); };

  var vscode = null;
  try { vscode = acquireVsCodeApi(); } catch (e) {}
  window.addEventListener('message', function (e) {
    var m = e.data;
    if (m && m.__tellurion === 'open' && typeof m.href === 'string' && /^https?:\\/\\//.test(m.href) && vscode) {
      vscode.postMessage({ type: 'open', href: m.href });
    }
  });

  function show(id) {
    ['connecting', 'unreachable', 'mismatch'].forEach(function (x) {
      document.getElementById(x).hidden = (x !== id);
    });
  }

  function frame() {
    show('connecting'); document.getElementById('connecting').hidden = true;
    var f = document.createElement('iframe');
    f.src = FRAME;
    f.setAttribute('allow', 'clipboard-read; clipboard-write');
    document.body.appendChild(f);
  }

  function mismatch(got) {
    document.getElementById('mUrl').textContent = ORIGIN;
    document.getElementById('mGot').textContent = got;
    document.getElementById('mWant').textContent = WANT;
    show('mismatch');
  }

  function unreachable() {
    document.getElementById('uUrl').textContent = ORIGIN;
    show('unreachable');
  }

  var tries = 0;
  function probe() {
    tries++;
    // /api/identity, not /health: the server answers it CORS-open (this page's
    // origin is vscode-webview://…), and it carries only identity — /health
    // stays CORS-closed because it exposes sensitive session state.
    fetch(ORIGIN + '/api/identity', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (h) {
        if (!h || !h.ok) return tries < 5 ? setTimeout(probe, 1200) : unreachable();
        // No expected root means the caller could not name one (no folder open);
        // an answer then is the best evidence available, so frame it.
        if (WANT && h.root && norm(h.root) !== norm(WANT)) return mismatch(h.root);
        frame();
      })
      .catch(function () { tries < 5 ? setTimeout(probe, 1200) : unreachable(); });
  }
  probe();
})();
</script>
</body></html>`;
}

module.exports = { wrapperHtml };
