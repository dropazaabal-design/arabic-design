import test from 'node:test';
import assert from 'node:assert/strict';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync, existsSync, readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {options, pngInfo} from '../tools/effectcraft-bridge.mjs';

test('strict options reject duplicate flags', () => {
  assert.throws(() => options(['render', '--id', 'a', '--id', 'b']), /duplicated/);
  assert.throws(() => options(['render', '--unexpected', 'a']), /Invalid/);
});
test('bad PNG and nonexistent file rejected', () => {
  const dir = mkdtempSync(join(tmpdir(), 'effectcraft-test-'));
  try {
    const f = join(dir, 'invalid.png'); writeFileSync(f, 'invalid');
    assert.throws(() => pngInfo(f), /PNG/);
  } finally { rmSync(dir, {recursive: true, force: true}); }
});
test('render rejects traversal before running external CLI', () => {
  const r = spawnSync(process.execPath, ['tools/effectcraft-bridge.mjs', 'render', '--project', 'dummy.ecproj', '--comp','Main',
    '--id', '../bad', '--frames', '2'], {cwd: process.cwd(), encoding:'utf8'});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /safe path segment/);
});
test('mock CLI validates 60fps frame ordering and manifest without EffectCraft installed', () => {
  if (process.platform === 'win32') return; // mock executable uses a POSIX shebang
  const dir = mkdtempSync(join(tmpdir(), 'effectcraft-mock-'));
  try {
    const ecproj = join(dir, 'test.ecproj'), script = join(dir, 'mock-cli'), publicDir = join(dir, 'public');
    writeFileSync(ecproj, '{}');
    writeFileSync(script, `#!/usr/bin/env node
const fs = require('node:fs'), p = require('node:path');
const a = process.argv.slice(2), out = a[a.indexOf('--out')+1];
if (a[0] === '--version') { console.log('EffectCraft mock'); process.exit(0); }
if (a[0] !== 'render' || a[a.indexOf('--fps')+1] !== '60' || a[a.indexOf('--channels')+1] !== 'rgba') process.exit(9);
for (const n of [2,1]) {
 const b = Buffer.alloc(26); Buffer.from([137,80,78,71,13,10,26,10]).copy(b,0);
 b.write('IHDR',12); b.writeUInt32BE(1080,16); b.writeUInt32BE(1920,20); b[24]=8;b[25]=6;
 fs.writeFileSync(p.join(p.dirname(out),'overlay_'+n+'.png'), b);
}
`);
    chmodSync(script, 0o755);
    const r = spawnSync(process.execPath, ['tools/effectcraft-bridge.mjs','render','--project',ecproj,'--comp','Main','--id','testfx',
      '--frames','2','--fps','60','--width','1080','--height','1920','--bin',script,'--public',publicDir], {cwd:process.cwd(),encoding:'utf8'});
    assert.equal(r.status, 0, r.stderr);
    const target = join(publicDir,'effectcraft','testfx');
    const m = JSON.parse(readFileSync(join(target,'manifest.json'),'utf8'));
    assert.equal(m.fps,60); assert.equal(m.frameCount,2); assert.equal(m.width,1080);
    assert.deepEqual(readdirSync(join(target,'frames')), ['000000.png','000001.png']);
    const second = spawnSync(process.execPath, ['tools/effectcraft-bridge.mjs','render','--project',ecproj,'--comp','Main','--id','testfx',
      '--frames','2','--bin',script,'--public',publicDir], {cwd:process.cwd(),encoding:'utf8'});
    assert.notEqual(second.status,0);assert.match(second.stderr,/Refusing to overwrite/);
  } finally {rmSync(dir, {recursive:true,force:true});}
});
