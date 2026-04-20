// Demo seed data — loaded when ?demo=1 is in the URL

export const DEMO_THREADS = [
  {
    id: 'annual-planning-fy26',
    slug: 'annual-planning-fy26',
    filename: 'annual-planning-fy26.md',
    title: 'Annual Planning FY26',
    kind: 'project',
    status: 'active',
    tags: ['#planning', '#leadership'],
    people: ['Priya', 'Marco'],
    created: '2026-04-11T00:00:00.000Z',
    blocks: [
      { type: 'UPDATE',   date: '2026-04-17', id: 'upd-1', text: 'Kicked off planning with leadership. Draft circulated.' },
      { type: 'NOTE',     date: '2026-04-17', id: 'not-1', text: 'Key constraint: we can only staff two new bets this year. Need to pick.' },
      { type: 'FOLLOWUP', date: '2026-04-17', id: 'fu-1', text: 'Confirm headcount envelope', who: 'Priya', due: '2026-04-22', state: 'waiting', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-17', id: 'fu-2', text: 'Share customer-signal memo with the team', who: 'Marco', due: new Date().toISOString().slice(0,10), state: 'open', links: [] },
      { type: 'QUESTION', date: '2026-04-18', id: 'que-1', text: 'Do we still treat platform as a bet, or is it baseline?' },
      { type: 'DECISION', date: '2026-04-18', id: 'dec-1', text: 'Platform is baseline. Bets = Growth + Reliability.', links: ['fu-1'] },
      { type: 'FOLLOWUP', date: '2026-04-18', id: 'fu-3', text: 'Write up the two-bet framing doc', who: 'me', due: '2026-04-24', state: 'open', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-18', id: 'fu-overdue', text: 'Draft Q2 OKRs for review', who: 'me', due: '2026-04-15', state: 'open', links: [] },
    ],
  },
  {
    id: 'hiring-staff-pm',
    slug: 'hiring-staff-pm',
    filename: 'hiring-staff-pm.md',
    title: 'Hiring — Staff PM role',
    kind: 'project',
    status: 'active',
    tags: ['#hiring', '#team'],
    people: ['Ravi', 'Dana', 'Ellis'],
    created: '2026-04-10T00:00:00.000Z',
    blocks: [
      { type: 'FOLLOWUP', date: '2026-04-16', id: 'fu-4', text: 'Ask Ravi to send rubric v2 for the panel', who: 'Ravi', due: '2026-04-21', state: 'waiting', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-18', id: 'fu-5', text: 'Hiring panel calibration session', who: 'me', due: '2026-05-08', state: 'open', links: [] },
      { type: 'QUESTION', date: '2026-04-19', id: 'que-2', text: 'Should we open a second PM role given the growth plan?' },
    ],
  },
  {
    id: 'ravi-1on1s',
    slug: 'ravi-1on1s',
    filename: 'ravi-1on1s.md',
    title: 'Ravi — 1:1s & growth',
    kind: 'person',
    status: 'active',
    tags: ['#1on1', '#growth'],
    people: ['Ravi'],
    created: '2026-03-01T00:00:00.000Z',
    blocks: [
      { type: 'DECISION', date: '2026-04-16', id: 'dec-2', text: 'Offer Ravi a staff-level growth track.', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-16', id: 'fu-6', text: 'Prep 1:1 agenda for Ravi', who: 'me', due: '2026-04-23', state: 'open', links: [] },
    ],
  },
  {
    id: 'board-prep-may',
    slug: 'board-prep-may',
    filename: 'board-prep-may.md',
    title: 'Board prep — May',
    kind: 'project',
    status: 'active',
    tags: ['#board', '#exec'],
    people: ['Priya'],
    created: '2026-04-08T00:00:00.000Z',
    blocks: [
      { type: 'DECISION', date: '2026-04-15', id: 'dec-3', text: 'Push board to May 22 to fit migration milestone.', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-17', id: 'fu-7', text: 'Send board draft v3 to Priya', who: 'Priya', due: new Date().toISOString().slice(0,10), state: 'open', links: [] },
    ],
  },
  {
    id: 'vendor-contract-acme',
    slug: 'vendor-contract-acme',
    filename: 'vendor-contract-acme.md',
    title: 'Vendor contract — Acme',
    kind: 'topic',
    status: 'active',
    tags: ['#legal'],
    people: ['Jordan'],
    created: '2026-04-01T00:00:00.000Z',
    blocks: [
      { type: 'DECISION', date: '2026-04-13', id: 'dec-4', text: 'Go with Acme on 2yr term, not 3.', links: [] },
      { type: 'FOLLOWUP', date: '2026-04-16', id: 'fu-8', text: "Get legal's read on the Acme clause", who: 'Jordan', due: '2026-04-16', state: 'waiting', links: [] },
    ],
  },
  {
    id: 'brand-refresh',
    slug: 'brand-refresh',
    filename: 'brand-refresh.md',
    title: 'Brand refresh — naming',
    kind: 'topic',
    status: 'paused',
    tags: ['#brand'],
    people: ['Mia'],
    created: '2026-03-15T00:00:00.000Z',
    blocks: [
      { type: 'QUESTION', date: '2026-04-10', id: 'que-3', text: 'Who owns the brand refresh after naming is decided?' },
      { type: 'FOLLOWUP', date: '2026-04-10', id: 'fu-9', text: 'Finalize naming shortlist', who: 'Mia', due: '2026-04-30', state: 'waiting', links: [] },
    ],
  },
];

export const DEMO_RITUALS = [
  { id: 'r-1', label: 'Morning journal', detail: '3 lines · what\'s on my mind' },
  { id: 'r-2', label: 'Meditate', detail: '10 min' },
  { id: 'r-3', label: 'Read · 20 min', detail: 'current: Thinking in Systems' },
  { id: 'r-4', label: 'Walk · 30 min', detail: 'any time outside' },
  { id: 'r-5', label: 'EOD review', detail: 'close loops · plan tomorrow' },
];

function pastDates(n) {
  const out = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    out.push(new Date(d - i * 86400000).toISOString().slice(0, 10));
  }
  return out;
}

export const DEMO_STREAKS = {
  'r-1': pastDates(14),
  'r-2': pastDates(9),
  'r-3': pastDates(6),
  'r-4': pastDates(21),
  'r-5': pastDates(11),
};

const today = new Date().toISOString().slice(0, 10);
export const DEMO_DONE_DATES = {
  'r-1': new Set([today]),
  'r-2': new Set([today]),
  'r-3': new Set(),
  'r-4': new Set(),
  'r-5': new Set(),
};

export const DEMO_SCRATCHES = [
  { id: 's-1', created: new Date(Date.now() - 600000).toISOString(), text: 'Figma link for brand moodboard: figma.com/file/xyz123', threadId: 'unassigned' },
  { id: 's-2', created: new Date(Date.now() - 86400000).toISOString(), text: 'AWS root pw — check 1password vault "infra"', threadId: 'unassigned' },
];
