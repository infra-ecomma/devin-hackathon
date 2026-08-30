// Demo timeline: a scripted quarter hour of fleet work, compressed. Emits the same
// record shapes the transcript tail produces, so the server folds them through the
// real reducer. Doubles as the acceptance-walk fixture, so keep the beats stable:
// the walk asserts on sentinel and shakeeb pulses, one workflow comet, one fault,
// two commits, and two dispatched agents (Explore and verifier).

const BEATS = [
  { t: 0.2, kind: 'prompt', text: 'take the live artifact over and make it beautiful' },
  { t: 0.8, kind: 'todos', todos: [
    { content: 'Read the recon inventory', activeForm: 'Reading the recon inventory', status: 'in_progress' },
    { content: 'Rebuild the orrery', activeForm: 'Rebuilding the orrery', status: 'pending' },
    { content: 'Rebuild the spine', activeForm: 'Rebuilding the spine', status: 'pending' },
    { content: 'Run the acceptance walk', activeForm: 'Running the acceptance walk', status: 'pending' },
  ] },
  { t: 1.6, kind: 'tool', name: 'Read', input: { file_path: 'live-artifact/data/world-static.json' } },
  { t: 2.4, kind: 'write', file: 'sentinel/daemon/judge.mjs' },
  { t: 3.2, kind: 'tool', name: 'Bash', input: { command: 'tbk-open http://tbk-forge-wsl:8768/' } },
  { t: 4.0, kind: 'write', file: 'live-artifact/public/orrery.js', created: true },
  { t: 4.8, kind: 'tool', name: 'Skill', input: { skill: 'apex' } },
  { t: 5.2, kind: 'tool', name: 'Task', input: { subagent_type: 'Explore', description: 'scan the orrery renderer' } },
  { t: 5.6, kind: 'write', file: 'features-ledger/logs/tbk-forge.jsonl' },
  { t: 6.4, kind: 'todos', todos: [
    { content: 'Read the recon inventory', activeForm: 'Reading the recon inventory', status: 'completed' },
    { content: 'Rebuild the orrery', activeForm: 'Rebuilding the orrery', status: 'in_progress' },
    { content: 'Rebuild the spine', activeForm: 'Rebuilding the spine', status: 'pending' },
    { content: 'Run the acceptance walk', activeForm: 'Running the acceptance walk', status: 'pending' },
  ] },
  { t: 7.2, kind: 'write', file: 'project-starter/agents/Hermes/02-zangetsu/zangetsu-state.json' },
  { t: 8.0, kind: 'tool', name: 'Agent', input: { subagent_type: 'verifier', description: 'judge the evidence' } },
  { t: 8.8, kind: 'commit', sha: 'demo1aa2bb3cc4dd5ee6ff7008cafe000deadbee1', subject: 'shakeeb v0.9.48: orb keeps its word' },
  { t: 9.6, kind: 'fault', label: 'walk step 9 timeout', detail: 'networkidle never fires on an open SSE stream' },
  { t: 10.4, kind: 'write', file: 'live-artifact/public/spine.js', created: true },
  { t: 11.2, kind: 'tool', name: 'Bash', input: { command: 'node verify/walk.mjs' } },
  { t: 12.0, kind: 'write', file: 'project-starter/governance/VERIFICATION-PROTOCOL.md' },
  { t: 12.8, kind: 'commit', sha: 'demo2aa2bb3cc4dd5ee6ff7008cafe000deadbee2', subject: 'sentinel: contrast defect closed, judge caged' },
  { t: 13.6, kind: 'todos', todos: [
    { content: 'Read the recon inventory', activeForm: 'Reading the recon inventory', status: 'completed' },
    { content: 'Rebuild the orrery', activeForm: 'Rebuilding the orrery', status: 'completed' },
    { content: 'Rebuild the spine', activeForm: 'Rebuilding the spine', status: 'completed' },
    { content: 'Run the acceptance walk', activeForm: 'Running the acceptance walk', status: 'in_progress' },
  ] },
];

export function runDemo(sink, { speed = 6, loop = true } = {}) {
  let stopped = false;
  const timers = [];
  const schedule = (offsetMs) => {
    for (const b of BEATS) {
      timers.push(setTimeout(() => {
        if (stopped) return;
        const at = Date.now();
        if (b.kind === 'write') sink({ kind: 'write', file: b.file, created: !!b.created, at });
        else if (b.kind === 'commit') sink({ kind: 'commit', sha: b.sha, subject: b.subject, at });
        else sink({ ...b, at });
      }, offsetMs + (b.t * 1000 * 6) / speed));
    }
  };
  const spanMs = (BEATS[BEATS.length - 1].t * 1000 * 6) / speed + 2000;
  schedule(0);
  let iv = null;
  if (loop) iv = setInterval(() => schedule(0), spanMs);
  return () => { stopped = true; timers.forEach(clearTimeout); if (iv) clearInterval(iv); };
}
