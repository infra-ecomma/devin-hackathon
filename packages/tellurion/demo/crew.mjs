// The standing crew, for the landing page.
//
// The plate drawn from the settled fixture alone holds four planets and their
// moons and nothing else moving, which reads as an empty sky: the whole left half
// is bench and grid. This puts the six agents the story dispatches onto it as a
// standing state rather than as a moment in a timeline — who is on this project
// and what each one is working on.
//
// It is NOT a second story and it writes nothing. story.mjs earns its writes by
// being a timeline an audience watches; this only emits the same Task records a
// real session emits, through the same ingest, so every chevron on the plate came
// out of the reducer the ordinary way. An agent is drawn unlike a planet on
// purpose — presence, activity and target, nothing more — so nothing here has to
// invent detail a transcript would not have.
//
// Each description names its product in words, because that is how the attributor
// finds the planet to hang the agent on (planetForSubject reads the subject line,
// it is not given an id).

import fs from 'node:fs';
import path from 'node:path';

// Who is on Lantern. The same six names story.mjs uses, so the two demos speak
// about the same crew rather than each inventing one.
const CREW = [
  ['Scout', 'read the customer account pages and find where sign-in actually happens'],
  ['Builder', 'build the delivery tracker: the moving dot and the arrival estimate'],
  ['Judge', 'walk the checkout like a customer and report what you actually saw'],
  ['Librarian', 'find everything we already said about the shop front'],
  ['Fixer', 'checkout: make the receipt list the items from THIS order, not the previous one'],
  ['Courier', 'publish the shop front and check the page actually loads'],
];

export async function run({ root, record }) {
  // Same fence as the story: emitting records is harmless, but a file named
  // DEMO-PROJECT is the only thing that distinguishes a demo directory from
  // somebody's real one, and this module should be impossible to point at a real
  // project by mistake even though it does not write.
  if (!fs.existsSync(path.join(root, '.tellurion', 'DEMO-PROJECT'))) {
    throw new Error(`refusing to run: ${root} is not a demo project (no .tellurion/DEMO-PROJECT marker)`);
  }

  // Spread the dispatches over a few seconds of recorded time rather than
  // stamping them all at one instant: agentList sorts by activity and then by
  // recency, so an identical timestamp on all six leaves their order down to
  // object insertion, which is not a thing the plate should be deciding.
  const now = Date.now();
  CREW.forEach(([who, description], i) => {
    record({ kind: 'tool', name: 'Task', at: now - (CREW.length - 1 - i) * 9_000, input: { subagent_type: who, description } });
  });
}
