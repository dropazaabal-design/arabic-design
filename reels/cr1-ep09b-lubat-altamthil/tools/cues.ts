// Writes timing/cues.json from src/cues.ts, so the mix uses the picture's own frames.
// npx esbuild tools/cues.ts --bundle --platform=node --format=esm --outfile=$S/cues.mjs && node $S/cues.mjs
import fs from 'node:fs';
import path from 'node:path';
import { CUES } from '../src/cues';

const out = path.resolve('timing/cues.json');
fs.writeFileSync(out, JSON.stringify(CUES.map(([frame, sfx, gain, pan]) => ({ frame, sfx, gain, pan }))) + '\n');
console.log(`${CUES.length} cues`);
