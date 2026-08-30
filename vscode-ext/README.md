# Tellurion, as a VS Code panel

The instrument for the project in **this** window, opened beside your code. There
is no project picker anywhere in it: the folder you have open IS the project.

## Installed on BOTH machines, because the panel spans both

He works on **Legion**; the projects and the instruments are on **Forge**, reached
over Remote-SSH. Those are two different computers and the panel touches both, so
the extension is installed on each:

| Machine | Path | Why |
| --- | --- | --- |
| Legion | `installed via VSIX (tbk-labs.tellurion-0.6.0.vsix)` | the UI extension host, and any folder opened locally |
| Forge | `installed via VSIX, into the RUNNING server (tbk-labs.tellurion-0.6.0)` | the remote host, where the project and the server are |

`extensionKind` is `["workspace", "ui"]` so VS Code picks the right side itself:
`workspace` on a Remote-SSH window, `ui` on a local folder.

**The webview renders on Legion.** A frame pointing at `127.0.0.1:<port>` would
resolve on Legion, where the instrument is not, so the URL goes through
`vscode.env.asExternalUri`, which forwards the remote port for the client and
returns the address unchanged when there is no remote. Without that the panel is
blank on every Remote-SSH window, which is the shape this is normally used in.

**It loads on the next window reload** (Developer: Reload Window). VS Code reads
its extension list at window start, so a reload is the one step that cannot be
done from outside the editor.

To reinstall after a change:

```bash
bash ~/projects/Organizing-Claude-Code/live-artifact/vscode-ext/build-vsix.sh
```

The script packages a real .vsix, installs it with each machine's own VS Code CLI,
and resolves the Forge side against the server process that is RUNNING (installing
into an older ~/.vscode-server/bin copy looks successful and changes nothing
visible). It loads on the next Developer: Reload Window.


## Use

- **Tellurion: Open the instrument** opens the panel beside the editor.
- **Tellurion: Stop this project's instrument** closes the panel, and stops the
  server *only if this window started it*. A server you started elsewhere, or a
  systemd unit, is left alone.

## How it decides what to show

1. It probes the configured port range and asks each server `/health`.
2. A port counts as this project's only when the server there reports the **same
   root**. Matching on "something answered" would attach the panel to another
   project's plate, which is the one mistake this extension exists to prevent.
3. If none is watching this folder and `tellurion.autoStart` is on, it starts one
   on the first free port and waits until that server answers **for this root**
   before opening the panel, rather than assuming the spawn worked.
4. The panel itself is a guard page (`wrapper.js`), not a blind frame: it probes
   `/api/identity` before framing. A dead server renders a card naming the URL and
   the fix; a port serving a **different** project renders a card naming both
   roots. No state of this extension is a blank square.

## Settings

| Setting | Default | What it does |
| --- | --- | --- |
| `tellurion.serverPath` | *(empty)* | Path to `live-artifact/server.mjs`. Empty means: look in this workspace, then in `~/projects/Organizing-Claude-Code`. |
| `tellurion.portRange` | `[8769, 8788]` | Ports the extension may use. |
| `tellurion.autoStart` | `true` | Start an instrument for this folder if none is watching it. |

## Verified

The extension's real `activate()` and `open()` were driven against a stubbed VS
Code API and the live servers, so this is the extension's own code path rather
than a reimplementation of it:

- **Organizing-Claude-Code** opened `Tellurion · Organizing-Claude-Code` framing
  `127.0.0.1:8769`, with the CSP naming only that origin
- **Maximus-Desktop** framed `8770`; **fleet-deck** framed `8768`. Each folder
  binds to its own instrument.
- opening twice **revealed** the existing panel instead of starting a second
- a folder with no instrument **spawned one** (DeSlop came up in genesis mode on
  the first free port) and the panel framed it; the test instrument was stopped
  afterwards and the three real ones were untouched
- no warning or error messages on any path

And the discovery logic on its own:

- finds 8769 for OCC, 8770 for Maximus Desktop, 8768 for Fleet Deck
- finds **nothing** for a folder no server is watching, rather than attaching to
  the wrong plate
- a trailing slash on the folder path still matches
- spawn path: started an instrument for an unwatched folder on a free port and
  confirmed it answered for that root in under ten seconds, then cleaned it up
