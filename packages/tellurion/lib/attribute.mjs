// Attribution: map live activity onto the entity graph.
// A file path lands on the planet whose home contains it; a tool name lands on
// the belt tool or comet workflow that carries it. Longest prefix wins, null means
// the event still counts (drive, ticker) but lights nothing specific.
//
// A GOVERNANCE PROCESS IS THE FOURTH CLASS, and until now nothing could return
// one. forTool had exactly three branches - Skill to a workflow, Agent to an
// unnamed comet, Bash to a belt tool - so no path in the reducer ever produced a
// p-id, pulse() never saw one, and the amber ring arc could not draw on any
// project. The row read "0 of 13" permanently, which says "you have never
// shipped to shares, never filed an ADR, never written a verification manifest",
// every one of which is false. The signals were always on the wire; the reducer
// simply had no branch to catch them.
//
// THE SIGNATURE LIVES IN THE DATA, on each process's `detect` block in
// world-static.json, and NOT derived from its `home`. A home is where a process
// is DOCUMENTED, which is a different fact from what it leaves behind when it
// runs: the decision-page process is homed at DECISION-PAGE-TEMPLATE.html but
// writes into decisions/, the verification protocol is homed at a .md but writes
// into verification/, and Ship to Shares is homed at a URL that no file path can
// ever match. Deriving the signature from the home lights three of the eleven
// and silently misses the rest, which is the exact defect this was built to fix.
//
// A process whose `detect` is null is BLIND BY CONSTRUCTION - a timer outside
// any session, a pre-commit hook that leaves no tool call - and is never matched
// here. The key names it as blind rather than showing it at zero, because
// "nothing can see this" and "you have never done this" are opposite facts and a
// bare 0 cannot tell them apart.

export function makeAttributor(stat) {
  const prefixes = (stat.attribution || [])
    .slice()
    .sort((a, b) => b.prefix.length - a.prefix.length);

  const workflowByName = new Map();
  for (const w of stat.workflows || []) workflowByName.set(w.name.toLowerCase(), w.id);

  const toolByName = new Map();
  for (const t of stat.tools || []) {
    toolByName.set(t.name.toLowerCase(), t.id);
    const bare = t.name.toLowerCase().replace(/\.(mjs|sh|py|ps1|vbs)$/, '');
    if (!toolByName.has(bare)) toolByName.set(bare, t.id);
  }

  // Five indexes, one per kind of signal a process can leave. Built once, from
  // the data, so adding a process is a data edit and never a code edit.
  const procBySkill = new Map();
  const procByCmd = new Map();
  const procByAgent = new Map();
  const procByTodo = [];
  const procPaths = [];
  for (const p of stat.processes || []) {
    if (!p || !p.id || !p.detect) continue;
    const d = p.detect;
    for (const x of d.skills || []) procBySkill.set(String(x).toLowerCase(), p.id);
    for (const x of d.cmds || []) procByCmd.set(String(x).toLowerCase(), p.id);
    for (const x of d.agents || []) procByAgent.set(String(x).toLowerCase(), p.id);
    if (d.todos) procByTodo.push(p.id);
    for (const x of d.paths || []) {
      const raw = String(x).replace(/\\/g, '/').toLowerCase();
      procPaths.push({ id: p.id, prefix: raw.replace(/\/+$/, ''), dir: raw.endsWith('/') });
    }
  }
  procPaths.sort((a, b) => b.prefix.length - a.prefix.length);

  const planetWords = (stat.planets || []).map(p => ({
    id: p.id,
    words: p.name.toLowerCase().split(/\s+/).filter(w => w.length > 3),
  })).filter(p => p.words.length);

  // A product the plan gives a `home` to is connected to the project itself:
  // work under that repo-relative path lights the declared planet even when the
  // words never match. Longest home wins, same rule as the history prefixes.
  const planetHomes = (stat.planets || [])
    .filter(p => p.home)
    .map(p => ({ id: p.id, home: String(p.home).replace(/\\/g, '/').replace(/^\.+\//, '').replace(/\/+$/, '') }))
    .filter(p => p.home)
    .sort((a, b) => b.home.length - a.home.length);

  function planetForPath(rel) {
    if (!rel) return null;
    const norm = String(rel).replace(/\\/g, '/').replace(/^\.\//, '');
    for (const { prefix, entity } of prefixes) {
      if (norm === prefix || norm.startsWith(prefix + '/')) return entity;
    }
    for (const { id, home } of planetHomes) {
      if (norm === home || norm.startsWith(home + '/')) return id;
    }
    return null;
  }

  // Tool events from the transcript tail: name is the harness tool
  // (Bash, Skill, Agent, Read...); the interesting identity is inside input.
  function forTool(name, input) {
    const n = String(name || '').toLowerCase();
    if (n === 'skill' && input && input.skill) {
      const w = workflowByName.get(String(input.skill).toLowerCase().split(':')[0]);
      if (w) return { kind: 'workflow', id: w };
    }
    if ((n === 'agent' || n === 'task') && input && input.subagent_type) {
      return { kind: 'workflow', id: null }; // an agent run flies as an unnamed comet flash
    }
    if (n === 'bash' && input && input.command) {
      const head = String(input.command).trim().split(/\s+/).slice(0, 4);
      for (const tok of head) {
        const base = tok.split('/').pop().toLowerCase();
        const t = toolByName.get(base);
        if (t) return { kind: 'tool', id: t };
      }
    }
    return null;
  }

  // A process signature on a tool call. Additive, never a replacement: running
  // the ledger appender lights the belt tool you ran AND the ring arc it serves,
  // because those are two different classes on the plate.
  function processForTool(name, input) {
    const n = String(name || '').toLowerCase();
    if (n === 'skill' && input && input.skill) {
      const hit = procBySkill.get(String(input.skill).toLowerCase().split(':')[0]);
      if (hit) return hit;
    }
    // A ROUTED SUBAGENT IS THE DELEGATION SIGNATURE, and it is the only signal
    // that process leaves: rule 40 routing shows up as a scout, ops-scout or
    // mech-executor dispatch, never as a command anyone types.
    if ((n === 'agent' || n === 'task') && input && input.subagent_type) {
      const hit = procByAgent.get(String(input.subagent_type).toLowerCase());
      if (hit) return hit;
    }
    if (n === 'bash' && input && input.command) {
      // The WHOLE line, not just its head. forTool reads four tokens because a
      // belt tool is the command being run; a process is named further in -
      // `python3 tools/ledger/troubleshooting-ledger.py append` puts it at
      // argv[1], and a `cd X && tbk-relay-worker ...` puts it later still.
      for (const tok of String(input.command).split(/[\s;|&()<>"']+/).slice(0, 32)) {
        const base = tok.split('/').pop().toLowerCase();
        if (!base) continue;
        const hit = procByCmd.get(base);
        if (hit) return hit;
      }
    }
    return null;
  }

  // A written path. `decisions/` matches at the repo root and at any depth,
  // because a project keeps its decision pages under its own subtree as often as
  // not. A signature with no trailing slash is a file and matches on its name.
  function processForPath(rel) {
    if (!rel) return null;
    const norm = String(rel).replace(/\\/g, '/').replace(/^\.\//, '').toLowerCase();
    for (const { id, prefix, dir } of procPaths) {
      if (dir) {
        if (norm === prefix || norm.startsWith(prefix + '/') || norm.includes('/' + prefix + '/')) return id;
      } else if (norm === prefix || norm.endsWith('/' + prefix)) return id;
    }
    return null;
  }

  // A TodoWrite IS the features-ledger capture - the ledger is a hook on that
  // exact call - so the todos event is the signature, not a proxy for it.
  function processesForTodos() { return procByTodo; }

  function planetForSubject(subject) {
    const s = String(subject || '').toLowerCase();
    for (const p of planetWords) {
      if (p.words.some(w => s.includes(w))) return p.id;
    }
    return null;
  }

  return { planetForPath, forTool, planetForSubject, processForTool, processForPath, processesForTodos };
}
