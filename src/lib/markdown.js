// Markdown parser / serializer for Thread threads, rituals, and scratch files.
// No external AST — simple line-by-line parsing of our own format.

import { nanoid } from './nanoid.js';

// ── Thread format ──────────────────────────────────────────────────────────
//
// ---
// title: My Thread
// kind: project | topic | person
// status: active | paused | closed
// tags: [tag1, tag2]
// people: [Alice, Bob]
// created: ISO date
// ---
//
// ## 2026-04-17
//
// [UPDATE] Text here.
// [NOTE] Text here.
// [FOLLOWUP] id:fu-1 | Text | @Person | due:2026-04-22 | state:waiting
// [DECISION] Text | links:fu-1
// [QUESTION] Text

export function parseThread(raw) {
  const lines = raw.split('\n');
  let inFrontmatter = false;
  let fmLines = [];
  let fmDone = false;
  let meta = { title: '', kind: 'project', status: 'active', tags: [], people: [], created: new Date().toISOString() };
  let blocks = [];
  let currentDate = '';
  let fmCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Frontmatter
    if (!fmDone) {
      if (line.trim() === '---') {
        fmCount++;
        if (fmCount === 1) { inFrontmatter = true; continue; }
        if (fmCount === 2) { fmDone = true; meta = parseFrontmatter(fmLines); continue; }
      }
      if (inFrontmatter) { fmLines.push(line); continue; }
    }

    // Date heading
    if (line.startsWith('## ')) {
      currentDate = line.slice(3).trim();
      continue;
    }

    // Block lines
    const block = parseBlockLine(line, currentDate);
    if (block) blocks.push(block);
  }

  return { meta, blocks };
}

function parseFrontmatter(lines) {
  const obj = { title: '', kind: 'project', status: 'active', tags: [], people: [], created: new Date().toISOString() };
  for (const line of lines) {
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const val = line.slice(colon + 1).trim();
    if (key === 'tags' || key === 'people') {
      obj[key] = val.replace(/[\[\]]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}

// Newlines in block text are stored as literal \n in the file so the
// line-by-line parser can read them back correctly.
function encodeText(t) { return t.replace(/\n/g, '\\n'); }
function decodeText(t) { return t.replace(/\\n/g, '\n'); }

function parseBlockLine(line, date) {
  const m = line.match(/^\[(\w+)\]\s*(.*)/);
  if (!m) return null;
  const type = m[1].toUpperCase();
  const rest = m[2];

  if (type === 'FOLLOWUP') {
    const parts = rest.split('|').map(s => s.trim());
    const block = { type, date, id: '', text: '', who: '', due: '', state: 'open', links: [] };
    for (const p of parts) {
      if (p.startsWith('id:')) block.id = p.slice(3);
      else if (p.startsWith('@')) block.who = p.slice(1);
      else if (p.startsWith('due:')) block.due = p.slice(4);
      else if (p.startsWith('state:')) block.state = p.slice(6);
      else if (p.startsWith('links:')) block.links = p.slice(6).split(',').map(s => s.trim());
      else if (p) block.text = decodeText(p);
    }
    if (!block.id) block.id = 'fu-' + nanoid(6);
    return block;
  }

  if (type === 'DECISION') {
    const parts = rest.split('|').map(s => s.trim());
    const block = { type, date, id: 'dec-' + nanoid(6), text: '', links: [] };
    for (const p of parts) {
      if (p.startsWith('links:')) block.links = p.slice(6).split(',').map(s => s.trim());
      else if (p) block.text = decodeText(p);
    }
    return block;
  }

  return { type, date, id: type.toLowerCase().slice(0,3) + '-' + nanoid(6), text: decodeText(rest.trim()) };
}

export function serializeThread(meta, blocks) {
  const fm = [
    '---',
    `title: ${meta.title}`,
    `kind: ${meta.kind}`,
    `status: ${meta.status}`,
    `tags: [${meta.tags.join(', ')}]`,
    `people: [${meta.people.join(', ')}]`,
    `created: ${meta.created}`,
    '---',
    '',
  ].join('\n');

  // Group blocks by date
  const byDate = {};
  for (const b of blocks) {
    const d = b.date || 'undated';
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(b);
  }

  const sections = Object.entries(byDate).map(([date, blks]) => {
    const header = date !== 'undated' ? `## ${date}\n\n` : '';
    const body = blks.map(serializeBlock).join('\n');
    return header + body;
  });

  return fm + sections.join('\n\n') + '\n';
}

function serializeBlock(b) {
  if (b.type === 'FOLLOWUP') {
    const parts = [`[FOLLOWUP] id:${b.id}`, encodeText(b.text)];
    if (b.who) parts.push(`@${b.who}`);
    if (b.due) parts.push(`due:${b.due}`);
    parts.push(`state:${b.state}`);
    if (b.links && b.links.length) parts.push(`links:${b.links.join(',')}`);
    return parts.join(' | ');
  }
  if (b.type === 'DECISION') {
    let s = `[DECISION] ${encodeText(b.text)}`;
    if (b.links && b.links.length) s += ` | links:${b.links.join(',')}`;
    return s;
  }
  return `[${b.type}] ${encodeText(b.text)}`;
}

export function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ── Rituals format ─────────────────────────────────────────────────────────
//
// [RITUAL] id:r-1 | Morning journal | detail:3 lines
// [STREAK] r-1 | 2026-04-19
// [STREAK] r-1 | 2026-04-18
// [DONE] r-1 | 2026-04-19   ← today's completion marker

export function parseRituals(raw) {
  if (!raw) return { rituals: [], streaks: {}, doneDates: {} };
  const lines = raw.split('\n');
  const rituals = [];
  const streaks = {}; // ritualId → Date[]
  const doneDates = {}; // ritualId → Set<dateStr>

  for (const line of lines) {
    const m = line.match(/^\[(\w+)\]\s*(.*)/);
    if (!m) continue;
    const type = m[1];
    const rest = m[2];

    if (type === 'RITUAL') {
      const parts = rest.split('|').map(s => s.trim());
      const r = { id: '', label: '', detail: '', pinned: false };
      for (const p of parts) {
        if (p.startsWith('id:')) r.id = p.slice(3);
        else if (p.startsWith('detail:')) r.detail = p.slice(7);
        else if (p === 'pinned:true') r.pinned = true;
        else if (p) r.label = p;
      }
      if (!r.id) r.id = 'r-' + nanoid(6);
      rituals.push(r);
    }

    if (type === 'STREAK' || type === 'DONE') {
      const [id, dateStr] = rest.split('|').map(s => s.trim());
      if (!streaks[id]) streaks[id] = [];
      if (dateStr) {
        streaks[id].push(dateStr);
        if (!doneDates[id]) doneDates[id] = new Set();
        doneDates[id].add(dateStr);
      }
    }
  }

  return { rituals, streaks, doneDates };
}

export function serializeRituals(rituals, streaks, doneDates) {
  const lines = ['---', 'type: rituals', '---', ''];
  for (const r of rituals) {
    let line = `[RITUAL] id:${r.id} | ${r.label} | detail:${r.detail}`;
    if (r.pinned) line += ' | pinned:true';
    lines.push(line);
  }
  lines.push('');
  for (const [id, dates] of Object.entries(streaks)) {
    for (const d of dates) {
      lines.push(`[STREAK] ${id} | ${d}`);
    }
  }
  return lines.join('\n') + '\n';
}

export function computeStreak(dates) {
  if (!dates || dates.length === 0) return 0;
  const sorted = [...dates].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expect = today;
  for (const d of sorted) {
    if (d === expect) {
      streak++;
      const dt = new Date(expect);
      dt.setDate(dt.getDate() - 1);
      expect = dt.toISOString().slice(0, 10);
    } else {
      break;
    }
  }
  return streak;
}

// ── Scratch format ─────────────────────────────────────────────────────────
//
// [SCRATCH] id:s-1 | 2026-04-19T10:30:00 | Note text | thread:unassigned

export function parseScratch(raw) {
  if (!raw) return [];
  const lines = raw.split('\n');
  const scratches = [];
  for (const line of lines) {
    const m = line.match(/^\[SCRATCH\]\s*(.*)/);
    if (!m) continue;
    const parts = m[1].split('|').map(s => s.trim());
    const s = { id: '', created: '', text: '', threadId: 'unassigned' };
    for (const p of parts) {
      if (p.startsWith('id:')) s.id = p.slice(3);
      else if (p.startsWith('thread:')) s.threadId = p.slice(7);
      else if (p.match(/^\d{4}-\d{2}-\d{2}/)) s.created = p;
      else if (p) s.text = p;
    }
    if (!s.id) s.id = 's-' + nanoid(6);
    scratches.push(s);
  }
  return scratches;
}

export function serializeScratch(scratches) {
  const lines = ['---', 'type: scratch', '---', ''];
  for (const s of scratches) {
    lines.push(`[SCRATCH] id:${s.id} | ${s.created} | ${s.text} | thread:${s.threadId}`);
  }
  return lines.join('\n') + '\n';
}
