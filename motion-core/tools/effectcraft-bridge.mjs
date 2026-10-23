#!/usr/bin/env node
/**
 * Optional EffectCraft -> Remotion RGBA-PNG bridge.
 * EffectCraft is an external application; this script does not install it.
 * Rendering stays opt-in. Existing Remotion renders are unaffected.
 */
import {spawnSync} from 'node:child_process';
import {
  closeSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, openSync,
  readSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync
} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export function options(argv) {
  const command = argv[0];
  if (!['doctor', 'render'].includes(command)) {
    throw new Error('Usage: node tools/effectcraft-bridge.mjs doctor | render --project FILE.ecproj --comp NAME --id SLUG --frames N [--fps 60] [--public ./public] [--bin PATH]');
  }
  const result = {command};
  const allowed = new Set(['--project', '--comp', '--id', '--frames', '--fps', '--public', '--bin', '--width', '--height']);
  for (let i = 1; i < argv.length; i += 2) {
    if (!allowed.has(argv[i]) || !argv[i + 1] || result[argv[i].slice(2)] !== undefined) {
      throw new Error('Invalid or duplicated option: ' + argv[i]);
    }
    result[argv[i].slice(2)] = argv[i + 1];
  }
  return result;
}

export function findCli(override) {
  if (override) return override;
  if (process.env.EFFECTCRAFT_CLI) return process.env.EFFECTCRAFT_CLI;
  if (process.platform === 'win32') {
    const defaultExe = join(process.env.ProgramFiles || 'C:\\Program Files', 'EffectCraft', 'effectcraft-cli.exe');
    if (existsSync(defaultExe)) return defaultExe;
  }
  return 'effectcraft-cli';
}

export function pngInfo(file) {
  const fd = openSync(file, 'r');
  const b = Buffer.alloc(26);
  try {
    if (readSync(fd, b, 0, 26, 0) !== 26 ||
        !b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ||
        b.toString('ascii', 12, 16) !== 'IHDR') {
      throw new Error('Not a PNG with IHDR: ' + basename(file));
    }
  } finally {
    closeSync(fd);
  }
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20), colorType = b[25];
  if (!width || !height || colorType !== 6) {
    throw new Error('An RGBA PNG is required for transparency: ' + basename(file));
  }
  return {width, height};
}

function invoke(bin, args) {
  const r = spawnSync(bin, args, {encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024});
  if (r.error || r.status !== 0) {
    throw new Error('EffectCraft CLI failed: ' + (r.error?.message || r.stderr?.trim() || r.stdout?.trim() || 'exit ' + r.status));
  }
  return r.stdout?.trim() || '';
}

export function run(argv = process.argv.slice(2)) {
  const o = options(argv), bin = findCli(o.bin);
  if (o.command === 'doctor') {
    const result = invoke(bin, ['--version']);
    console.log('EffectCraft CLI ready: ' + (result || bin));
    return;
  }
  if (!o.project || !o.comp || !o.id || !o.frames) throw new Error('render requires --project, --comp, --id and --frames');
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(o.id)) throw new Error('--id must be a safe path segment');
  const fps = Number(o.fps ?? 60), frames = Number(o.frames);
  if (![30,60].includes(fps) || !Number.isSafeInteger(frames) || frames < 1 || frames > 21600) {
    throw new Error('fps must be 30 or 60; frames must be an integer between 1 and 21600');
  }
  const width = o.width ? Number(o.width) : null;
  const height = o.height ? Number(o.height) : null;
  if ((width !== null && (!Number.isSafeInteger(width) || width < 1)) ||
      (height !== null && (!Number.isSafeInteger(height) || height < 1))) {
    throw new Error('width and height must be positive integers');
  }
  const project = resolve(o.project);
  if (!existsSync(project) || !project.endsWith('.ecproj')) throw new Error('Missing EffectCraft .ecproj: ' + project);
  const publicDir = resolve(o.public || 'public');
  const targetParent = join(publicDir, 'effectcraft');
  const target = join(targetParent, o.id);
  if (existsSync(target)) throw new Error('Refusing to overwrite existing overlay: ' + target);
  mkdirSync(targetParent, {recursive: true});

  // Render outside the published directory so Remotion never sees partial output.
  const work = mkdtempSync(join(tmpdir(), 'effectcraft-'));
  let staging;
  try {
    invoke(bin, ['render', project, '--comp', o.comp, '--out', join(work, 'overlay.png'),
      '--format', 'png', '--fps', String(fps), '--channels', 'rgba', '--audio', 'off']);
    const files = readdirSync(work).filter(f => /^overlay.*\.png$/i.test(f)).sort((a,b)=>a.localeCompare(b, 'en', {numeric:true}));
    if (files.length !== frames) throw new Error('Expected ' + frames + ' frames at ' + fps + 'fps; EffectCraft exported ' + files.length + '. Check composition length.');
    staging = mkdtempSync(join(targetParent, '.' + o.id + '-'));
    const dest = join(staging, 'frames');
    mkdirSync(dest);
    let size;
    files.forEach((file, i) => {
      const src = join(work, file), info = pngInfo(src);
      if (size && (info.width !== size.width || info.height !== size.height)) throw new Error('Inconsistent PNG dimensions');
      if ((width !== null && info.width !== width) || (height !== null && info.height !== height)) {
        throw new Error('Overlay PNG dimensions do not match --width/--height');
      }
      size = info;
      copyFileSync(src, join(dest, String(i).padStart(6, '0') + '.png'));
    });
    writeFileSync(join(staging, 'manifest.json'), JSON.stringify({
      version: 1, engine: 'EffectCraft', id: o.id, comp: o.comp, fps,
      frameCount: frames, ...size, hasAlpha: true,
      pattern: 'frames/%06d.png'
    }, null, 2) + '\n');
    if (existsSync(target)) throw new Error('Overlay target now exists: ' + target);
    renameSync(staging, target);
    staging = undefined;
    console.log('Overlay ready: ' + target + ' (' + frames + ' RGBA frames at ' + fps + 'fps)');
  } finally {
    if (staging) rmSync(staging, {recursive:true,force:true});
    rmSync(work, {recursive:true,force:true});
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { run(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
