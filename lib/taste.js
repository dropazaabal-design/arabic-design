#!/usr/bin/env node
'use strict';

/**
 * taste.js — what the creator said they like, kept with its scope and their
 * own words, and read back before the next design.
 *
 * Ported from the creator's own canva-design-memory skill (remember.py): the
 * same record, the same scopes, the same refusals. Learning here means an
 * explicit preference written down — never weights, never a guess.
 *
 *   - Nothing is saved without `evidence`: the creator's words that prove it.
 *   - The assistant's own choices and the creator's silence are not taste, so
 *     the record has no field that could hold them.
 *   - A preference is global, or for one format, or for one project. «For
 *     this campaign only» never becomes global.
 *   - Every change keeps what it replaced in `history`.
 *
 *   node lib/taste.js show
 *   node lib/taste.js for --format=reel [--project=name]
 *   node lib/taste.js put --id=reel-image-weight --scope=format:reel \
 *        --instruction='…' --evidence='…' [--design-url=https://www.canva.com/d/…]
 *   node lib/taste.js remove --id=… --scope=… --evidence='…'
 *   add --data=DIR to keep the profile in DIR/taste.json instead of the plugin root.
 */

const fs = require('fs');
const path = require('path');

const FORMATS = ['post', 'carousel', 'reel', 'story', 'ad', 'cover'];
const ID_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;
const FIELDS = ['id', 'scope', 'instruction', 'evidence', 'recorded_at'];

function validScope(scope) {
  if (scope === 'global') return;
  if (typeof scope === 'string' && scope.startsWith('format:') && FORMATS.includes(scope.slice(7))) return;
  if (typeof scope === 'string' && scope.startsWith('project:')) {
    const name = scope.slice(8);
    // eslint-disable-next-line no-control-regex
    if (name.length >= 1 && name.length <= 100 && name.trim() === name && !/[\u0000-\u001f]/.test(name)) return;
  }
  throw new Error(`النطاق يجب أن يكون global أو format:${FORMATS.join('/')} أو project:<اسم>.`);
}

function validEntry(entry) {
  if (!entry || typeof entry !== 'object' || !FIELDS.every((k) => k in entry)) {
    throw new Error('سجلّ ناقص: id وscope وinstruction وevidence وrecorded_at كلها لازمة.');
  }
  const extra = Object.keys(entry).filter((k) => !FIELDS.includes(k) && k !== 'design_url');
  if (extra.length) throw new Error(`حقل غير معروف: ${extra.join('، ')}.`);
  if (!ID_RE.test(entry.id)) throw new Error('المعرّف: حروف لاتينية صغيرة وأرقام وشرطات، حتى ٨٠.');
  validScope(entry.scope);
  for (const [key, limit] of [['instruction', 1600], ['evidence', 2000]]) {
    if (typeof entry[key] !== 'string' || !entry[key].trim() || entry[key].length > limit) {
      throw new Error(`${key} فارغ أو أطول من ${limit}.`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.recorded_at) || Number.isNaN(Date.parse(entry.recorded_at))) {
    throw new Error('recorded_at تاريخ بصيغة YYYY-MM-DD.');
  }
  if ('design_url' in entry) {
    let url;
    try { url = new URL(entry.design_url); } catch { url = null; }
    // A share link with a token or signed parameters is a credential, not taste.
    if (!url || url.protocol !== 'https:' || !['canva.com', 'www.canva.com', 'canva.link'].includes(url.hostname)
      || url.username || url.password || url.search || url.hash) {
      throw new Error('رابط Canva فقط، بلا معاملات استعلام ولا رموز موقّعة.');
    }
  }
}

function validProfile(profile) {
  if (!profile || profile.version !== 1) throw new Error('نسخة ملف الذوق غير مدعومة.');
  if (!Array.isArray(profile.preferences) || !Array.isArray(profile.history)) {
    throw new Error('ملف الذوق بلا preferences أو history.');
  }
  const seen = new Set();
  for (const entry of profile.preferences) {
    validEntry(entry);
    const key = `${entry.scope}\u0000${entry.id}`;
    if (seen.has(key)) throw new Error(`تفضيل مكرّر: ${entry.id} في ${entry.scope}.`);
    seen.add(key);
  }
}

const EMPTY = () => ({ version: 1, preferences: [], history: [] });

/** Add or replace one preference. Returns the new profile and whether it changed. */
function put(profile, entry) {
  validProfile(profile);
  validEntry(entry);
  const next = JSON.parse(JSON.stringify(profile));
  const old = next.preferences.find((e) => e.id === entry.id && e.scope === entry.scope) || null;
  if (old && JSON.stringify(old) === JSON.stringify(entry)) return { profile: next, changed: false };
  if (old) next.preferences.splice(next.preferences.indexOf(old), 1);
  next.preferences.push(entry);
  next.history.push({ action: 'put', recorded_at: entry.recorded_at, before: old, after: entry });
  return { profile: next, changed: true };
}

/** Remove one preference — only on the creator's word, which is kept. */
function remove(profile, { id, scope, evidence, recorded_at: recordedAt }) {
  validProfile(profile);
  validScope(scope);
  if (typeof evidence !== 'string' || !evidence.trim() || evidence.length > 2000) {
    throw new Error('الحذف يحتاج كلام المستخدم دليلًا.');
  }
  const next = JSON.parse(JSON.stringify(profile));
  const old = next.preferences.find((e) => e.id === id && e.scope === scope);
  if (!old) throw new Error('لا تفضيل بهذا المعرّف والنطاق؛ لم يتغيّر شيء.');
  next.preferences.splice(next.preferences.indexOf(old), 1);
  next.history.push({ action: 'remove', recorded_at: recordedAt, evidence, before: old });
  return next;
}

/**
 * The preferences that apply to one piece of work, in the order they are
 * applied: global, then the format, then the project — the narrower one read
 * last, so it is the one that wins where two disagree. The current request
 * outranks all of them; that is the caller's rule, not this file's.
 */
function applicable(profile, { format, project } = {}) {
  const rank = (e) => (e.scope === 'global' ? 0 : e.scope === `format:${format}` ? 1
    : e.scope === `project:${project}` ? 2 : -1);
  return profile.preferences.filter((e) => rank(e) >= 0).sort((a, b) => rank(a) - rank(b));
}

// ---------------------------------------------------------------------------
// File
// ---------------------------------------------------------------------------

function profilePath(dataDir) {
  return dataDir ? path.join(dataDir, 'taste.json') : path.join(__dirname, '..', 'taste.json');
}

function load(file) {
  if (!fs.existsSync(file)) return EMPTY();
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
  validProfile(profile);
  return profile;
}

/** Written whole to a temporary file, then renamed: a crash leaves the old file. */
function save(file, profile) {
  validProfile(profile);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(profile, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

function main(argv) {
  const [action, ...rest] = argv.slice(2);
  const flag = (name) => {
    const hit = rest.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : undefined;
  };
  const file = profilePath(flag('data'));
  const today = new Date().toISOString().slice(0, 10);
  const out = (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);

  try {
    const profile = load(file);
    if (action === 'show') return out({ file, ...profile });
    if (action === 'for') return out(applicable(profile, { format: flag('format'), project: flag('project') }));
    if (action === 'put') {
      const entry = {
        id: flag('id'), scope: flag('scope'), instruction: flag('instruction'),
        evidence: flag('evidence'), recorded_at: flag('date') || today,
      };
      if (flag('design-url')) entry.design_url = flag('design-url');
      const { profile: next, changed } = put(profile, entry);
      if (changed) save(file, next);
      return out({ file, changed, id: entry.id, scope: entry.scope });
    }
    if (action === 'remove') {
      save(file, remove(profile, {
        id: flag('id'), scope: flag('scope'), evidence: flag('evidence'), recorded_at: flag('date') || today,
      }));
      return out({ file, changed: true, id: flag('id'), scope: flag('scope') });
    }
    process.stderr.write('usage: taste.js show | for --format=… [--project=…] | put … | remove … [--data=DIR]\n');
    process.exit(2);
  } catch (error) {
    process.stderr.write(`taste: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) main(process.argv);

module.exports = { FORMATS, put, remove, applicable, load, save, profilePath, validEntry, validProfile, EMPTY };
