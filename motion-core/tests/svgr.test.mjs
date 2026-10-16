import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { parts } from '../tools/svgr-build.mjs';

const svg = fs.readFileSync(new URL('../art/characters/sultan.svg', import.meta.url), 'utf8');

test('the SVG source names every rig part, each with a pivot; hands carry a grip anchor', () => {
  const p = parts(svg), names = p.map((x) => x.name);
  for (const n of ['torso', 'head', 'hair', 'browNear', 'browFar', 'upperArm', 'forearm', 'handOpen', 'handFist', 'handPoint', 'gripBack', 'gripFront', 'thigh', 'shin', 'slipper', 'runner'])
    assert.ok(names.includes(n), `missing part ${n}`);
  assert.equal(new Set(names).size, names.length, 'part names are unique');
  for (const h of p.filter((x) => /^(hand|grip)/.test(x.name))) assert.ok(h.anchor, `${h.name} has no data-anchor`);
});

test('the committed Art.tsx is exactly what SVGR builds from the source', () => {
  execFileSync('node', [new URL('../tools/svgr-build.mjs', import.meta.url).pathname, 'sultan', '--check'], { stdio: 'pipe' });
});
