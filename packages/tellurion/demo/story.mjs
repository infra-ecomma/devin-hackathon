// The demo timeline: an orrery drawing itself as a plan is worked through.
//
// This is NOT a canned animation. Every beat below writes the same files a real
// session writes — the plan, the judge's verdicts, the operator's acceptances —
// and feeds the same record shapes a real transcript feeds. The server's own
// watchers pick them up and the browser receives ordinary deltas, so what an
// audience watches is the instrument running normally on invented inputs. If
// the instrument were broken, this demo would show it broken, which is the only
// property that makes a demo worth showing.
//
// Read the timeline as four acts:
//   1  a blank sky, and a plan declared one product at a time
//   2  the work: agents dispatched, steps taken in hand and finished, commits
//   3  the ladder: a judge passes six, rejects one, and the operator accepts five
//   4  the settle, and back to the top
//
// Nothing here is measured. Every name is invented to be readable cold.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../lib/tiers.mjs';
import { writeJsonAtomic } from '../lib/atomic.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FULL = JSON.parse(fs.readFileSync(path.join(HERE, 'plan-full.json'), 'utf8'));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// tmp-then-rename, NOT writeFileSync. This story rewrites the plan about forty
// times in seventy-eight seconds while the server's watcher polls the same file,
// so a plain write leaves a window where the reader gets a half-written file.
// readPlan() catches that and answers EMPTY, which blanks the spine for a frame
// and looks like the instrument losing the plan. lib/atomic.mjs exists for this
// exact race and the story had no business bypassing it.
const write = (file, obj) => writeJsonAtomic(file, obj);

// The product order the sky fills in. Deliberately the order a person would
// build them: the shelves, then the till, then the road, then the front door.
const ORDER = ['shop-front', 'checkout', 'delivery-tracker', 'customer-account'];

// Who is working. Six, named for what they do rather than for what they are, so
// nobody has to be told what a "subagent" is.
const CREW = {
  scout: 'Scout',          // finds where the work has to happen
  builder: 'Builder',      // writes it
  judge: 'Judge',          // checks it, and can say no
  librarian: 'Librarian',  // remembers what was said before
  fixer: 'Fixer',          // repairs what broke
  courier: 'Courier',      // ships it out
};

// The judge's findings, and the one rejection the whole instrument exists for.
const VERDICTS = [
  { step: 'product-search', by: CREW.judge, pass: true, via: 'customer-walk',
    matched: ['typed "milk", got 14 matching items', 'typed "zzzz", got the empty-shelf message'] },
  { step: 'photo-gallery', by: CREW.judge, pass: true, via: 'customer-walk',
    matched: ['swiped through 4 photos on 3 items', 'tapped a photo, it opened full size'] },
  { step: 'stock-levels', by: CREW.judge, pass: true, via: 'full-check',
    matched: ['sold-out items are greyed out and cannot be added to a basket'] },
  { step: 'save-for-later', by: CREW.judge, pass: true, via: 'customer-walk',
    matched: ['saved 3 items, all 3 were still there after signing out and back in'] },
  { step: 'card-payment', by: CREW.judge, pass: true, via: 'full-check',
    matched: ['a test card was charged and the money moved', 'a declined card showed the retry message'] },
  { step: 'discount-codes', by: CREW.judge, pass: true, via: 'customer-walk',
    matched: ['a real code took 10% off the basket', 'an invented code was refused'] },
  { step: 'live-map', by: CREW.judge, pass: true, via: 'customer-walk',
    matched: ['the driver dot moved along the street for 4 minutes'] },
  { step: 'receipt-email', by: CREW.judge, pass: false,
    note: 'The email arrives and the total is right, but it lists the items from the PREVIOUS order.' },
];
const ACCEPTS = ['product-search', 'photo-gallery', 'stock-levels', 'save-for-later', 'card-payment'];

export async function run({ root, record, speed = 1, loop = true }) {
  const TEL = path.join(root, '.tellurion');
  // THE INSTRUMENT NEVER WRITES TO WHAT IT DRAWS. This story does, which is the
  // only way it can be honest — a scripted picture would be a mock, and the one
  // thing this project refuses to ship is a body on the plate that no record
  // produced. So the write is real and the TARGET is fenced instead: a story
  // runs only inside a directory that has explicitly opted in by carrying the
  // marker file. Point --story at a real repo and it refuses rather than
  // rewriting somebody's plan.
  const marker = path.join(TEL, 'DEMO-PROJECT');
  if (!fs.existsSync(marker)) {
    throw new Error(`refusing to run: ${root} is not a demo project (no .tellurion/DEMO-PROJECT marker)`);
  }
  fs.mkdirSync(TEL, { recursive: true });
  const planFile = path.join(TEL, 'plan.json');
  const verdictFile = path.join(TEL, 'verdicts.json');
  const acceptFile = path.join(TEL, 'accepted.json');

  // Every wait goes through here, so one --speed knob stretches or compresses
  // the whole story without any beat drifting out of order relative to another.
  const beat = (ms) => sleep(Math.max(16, ms / speed));

  // A feature's fingerprint is taken over { id, title } — the same shape the
  // reducer rebuilds when it reads the row back. Computed, never typed: a hash
  // that is one character out does not fail loudly, it reads as STALE, and a
  // fully-verified feature quietly drops a rung.
  const featOf = new Map();
  for (const pr of FULL.products) for (const f of pr.features) featOf.set(f.id, { id: f.id, title: f.name });
  const fpOf = (id) => fingerprint(featOf.get(id));

  const say = (kind, o) => record({ kind, at: Date.now(), ...o });
  const tool = (name, input) => say('tool', { name, input });
  const dispatch = (who, description) => tool('Task', { subagent_type: who, description });
  const commit = (short, subject) =>
    say('commit', { sha: (short + '0'.repeat(40)).slice(0, 40), subject });

  // The plan as the sky currently knows it: the first n products, with each
  // step carrying whatever status the story has moved it to.
  const status = new Map();
  for (const ph of FULL.phases) for (const st of ph.steps) status.set(st.id, 'planned');
  let shown = 0;

  function publishPlan() {
    const products = FULL.products.slice(0, shown);
    const live = new Set(products.map((p) => p.id));
    const phases = FULL.phases
      .map((ph) => ({
        ...ph,
        steps: ph.steps
          .filter((st) => live.has(st.produces.of))
          .map((st) => ({ ...st, status: status.get(st.id) })),
      }))
      .filter((ph) => ph.steps.length);
    write(planFile, { ...FULL, products, phases });
  }

  function publishSignoffs(upto) {
    const rows = VERDICTS.slice(0, upto).map((v) => ({ ...v, fp: fpOf(v.step), at: new Date().toISOString() }));
    write(verdictFile, { verdicts: rows });
    return rows;
  }

  async function once() {
    /* ---------------------------------------------------- act 1: blank sky */
    shown = 0;
    for (const k of status.keys()) status.set(k, 'planned');
    publishPlan();
    write(verdictFile, { verdicts: [] });
    write(acceptFile, { accepted: [] });
    await beat(2600);

    say('prompt', { text: 'build the grocery app, and do not tell me it works until something has checked it' });
    await beat(1800);

    /* ------------------------------------ act 1b: the plan, product by product */
    // Each write lands on disk, the watcher reloads it, and the plate draws the
    // new body in. Four writes, four planets, in the order a person would build.
    for (const id of ORDER) {
      const pr = FULL.products.find((p) => p.id === id);
      shown++;
      publishPlan();
      say('prompt', { text: `${pr.name}: ${pr.features.length} parts declared before any of them is built` });
      await beat(2100);
    }
    await beat(1200);

    // The to-do list. This is the signature the Features Ledger watches for, so
    // writing one lights that ring arc — the ledger is a hook on this exact act.
    say('todos', {
      todos: [
        { content: 'Put the shelves up', activeForm: 'Putting the shelves up', status: 'in_progress' },
        { content: 'Open the till', activeForm: 'Opening the till', status: 'pending' },
        { content: 'Get it on the road', activeForm: 'Getting it on the road', status: 'pending' },
        { content: 'Give them a key to the door', activeForm: 'Giving them a key to the door', status: 'pending' },
      ],
    });
    await beat(1500);

    /* ------------------------------------------------------ act 2: the work */
    dispatch(CREW.librarian, 'find everything we already said about the shop front');
    tool('Skill', { skill: 'memsearch' });
    await beat(1400);

    dispatch(CREW.scout, 'read the product list and the shop front');
    await beat(1100);
    tool('Bash', { command: 'read-the-whole-folder app/shop' });
    await beat(900);

    // The shelves. Steps are taken IN HAND before they are finished, which is
    // what puts the turning arc on a moon.
    const SHELVES = ['search-box', 'search-wire', 'search-empty', 'gallery-swipe', 'gallery-zoom',
      'stock-read', 'stock-sold-out', 'save-button', 'save-list'];
    dispatch(CREW.builder, 'build the shop front');
    for (const st of SHELVES) {
      status.set(st, 'active'); publishPlan();
      await beat(620);
      status.set(st, 'done'); publishPlan();
      await beat(340);
    }
    commit('a1c0ffee', 'shop front: shelves, photos, stock and saved items');
    tool('Skill', { skill: 'first-draft' });
    await beat(1500);

    // The till.
    const TILL = ['card-form', 'card-take', 'card-declined', 'code-box', 'code-check',
      'slot-grid', 'receipt-send', 'receipt-content'];
    dispatch(CREW.builder, 'build the checkout');
    for (const st of TILL) {
      status.set(st, 'active'); publishPlan();
      await beat(560);
      status.set(st, 'done'); publishPlan();
      await beat(300);
    }
    commit('b2facade', 'checkout: card, codes, slots and the receipt');
    await beat(1100);

    say('fault', { label: 'delivery slot held twice', detail: 'two baskets were given the same 6pm slot' });
    dispatch(CREW.fixer, 'stop two baskets taking the same delivery slot');
    tool('Skill', { skill: 'troubleshooting-ledger' });
    status.set('slot-hold', 'active'); publishPlan();
    await beat(1800);

    // The road.
    dispatch(CREW.builder, 'build the delivery tracker');
    for (const st of ['map-draw', 'map-dot', 'eta-calc', 'text-send']) {
      status.set(st, 'active'); publishPlan();
      await beat(560);
      status.set(st, 'done'); publishPlan();
      await beat(300);
    }
    status.set('eta-traffic', 'active'); publishPlan();
    commit('c3d0cd00', 'delivery tracker: live map and the first arrival estimate');
    await beat(1400);

    say('todos', {
      todos: [
        { content: 'Put the shelves up', activeForm: 'Putting the shelves up', status: 'completed' },
        { content: 'Open the till', activeForm: 'Opening the till', status: 'completed' },
        { content: 'Get it on the road', activeForm: 'Getting it on the road', status: 'in_progress' },
        { content: 'Give them a key to the door', activeForm: 'Giving them a key to the door', status: 'pending' },
      ],
    });
    status.set('signin-form', 'done'); publishPlan();
    await beat(1300);

    /* -------------------------------------------------- act 3: the ladder */
    // Nobody has checked anything yet. Every moon on the plate is the BUILDER's
    // word and nothing more, which is the state the next thirty seconds is about.
    say('prompt', { text: 'the builder says eleven parts are done. nobody has checked one of them' });
    await beat(1600);

    dispatch(CREW.judge, 'walk the shop front like a customer and report what you actually saw');
    tool('Skill', { skill: 'customer-walk' });
    await beat(1500);

    // Six pass, one at a time, so the eye can follow a ring landing on a moon.
    for (let i = 1; i <= 7; i++) {
      publishSignoffs(i);
      await beat(1150);
    }

    // The rejection. A judge looking and saying NO is a different fact from
    // nobody having looked, and this is the beat that shows the difference.
    tool('Skill', { skill: 'penta-review' });
    await beat(1300);
    publishSignoffs(8);
    say('fault', { label: 'receipt lists the wrong items', detail: 'claimed done by the builder; the judge opened the email and read it' });
    say('prompt', { text: 'Broken Promises re-read the ledger and found one: the receipt was promised and never kept' });
    await beat(4200);

    dispatch(CREW.fixer, 'make the receipt list the items from THIS order');
    await beat(2200);

    /* --------------------------------------- act 3b: the operator's signature */
    say('prompt', { text: 'a judge passing something is still not a person accepting it' });
    await beat(1500);
    const passed = publishSignoffs(8);
    const vAt = new Map(passed.map((v) => [v.step, v.at]));
    for (let i = 1; i <= ACCEPTS.length; i++) {
      write(acceptFile, {
        accepted: ACCEPTS.slice(0, i).map((s) => ({
          step: s, by: 'Wassim', at: new Date().toISOString(), fp: fpOf(s), onVerdict: vAt.get(s),
        })),
      });
      await beat(1000);
    }

    dispatch(CREW.courier, 'publish the shop front and check the page actually loads');
    tool('Skill', { skill: 'ship-to-shares' });
    commit('d4e5f60a', 'shop front accepted and live');
    await beat(2400);

    say('prompt', { text: 'four products, fourteen parts. five carry a person\'s name. one is a broken promise, and it is still on the plate' });
    await beat(5200);
  }

  // Restores the finished state, so stopping the story never leaves the plate
  // mid-sentence: a demo that ends on a half-written plan looks like a crash.
  async function settle() {
    shown = ORDER.length;
    for (const ph of FULL.phases) for (const st of ph.steps) status.set(st.id, st.status);
    publishPlan();
    const passed = publishSignoffs(VERDICTS.length);
    const vAt = new Map(passed.map((v) => [v.step, v.at]));
    write(acceptFile, {
      accepted: ACCEPTS.map((s) => ({ step: s, by: 'Wassim', at: new Date().toISOString(), fp: fpOf(s), onVerdict: vAt.get(s) })),
    });
  }

  do {
    await once();
    if (!loop) { await settle(); return; }
    await beat(2000);
  } while (loop);
}
