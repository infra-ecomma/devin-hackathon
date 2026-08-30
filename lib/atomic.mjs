// Write JSON all-or-nothing. Every custody file under .tellurion/ is read back
// with a catch that answers EMPTY on unparseable content, so a kill mid-write
// does not damage the file it was writing — it silently forgets the whole chain
// of custody the file was carrying. tmp-then-rename is the whole fix: a reader
// only ever sees the old file or the new one, never the half-written one.
// usage.json was written this way from the start; this is that pattern, shared.

import fs from 'node:fs';
import path from 'node:path';

export function writeJsonAtomic(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, file);
}
