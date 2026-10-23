// Writes timing/cues.json from src/cues.ts (the picture's own frames) for tools/mix.py.
import { writeFileSync } from 'node:fs';
import { CUES } from '../src/cues';
import { TOTAL } from '../src/shots';
writeFileSync('timing/cues.json', JSON.stringify({ fps: 60, frames: TOTAL, cues: CUES.map(([f, sfx, gain, pan]) => ({ t: +(f / 60).toFixed(4), sfx, gain, pan })) }, null, 1) + '\n');
console.log(`${CUES.length} cues`);
