// Attribution: map live activity onto the entity graph.
// A file path lands on the planet whose home contains it; a tool name lands on
// the belt tool or comet workflow that carries it. Longest prefix wins, null means
// the event still counts (drive, ticker) but lights nothing specific.

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

  function planetForSubject(subject) {
    const s = String(subject || '').toLowerCase();
    for (const p of planetWords) {
      if (p.words.some(w => s.includes(w))) return p.id;
    }
    return null;
  }

  return { planetForPath, forTool, planetForSubject };
}
