import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { openDirectory, restoreDirectory, ensureDir, listFiles, listRootFiles, readFile, writeFile } from '../lib/fs.js';
import { parseThread, serializeThread, parseRituals, serializeRituals, parseScratch, serializeScratch, generateSlug, computeStreak } from '../lib/markdown.js';
import { nanoid } from '../lib/nanoid.js';
import { today } from '../lib/utils.js';
import { DEMO_THREADS, DEMO_RITUALS, DEMO_STREAKS, DEMO_DONE_DATES, DEMO_SCRATCHES } from '../lib/demoData.js';

const IS_DEMO = new URLSearchParams(window.location.search).has('demo');

const Ctx = createContext(null);

const INIT = {
  dirHandle: null,
  threads: [],
  activeThreadId: null,
  section: 'dashboard',
  rituals: [],
  streaks: {},
  doneDates: {},
  scratches: [],
  loading: true,
  error: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_DIR':      return { ...state, dirHandle: action.handle, loading: true, error: null };
    case 'SET_LOADING':  return { ...state, loading: action.value };
    case 'SET_ERROR':    return { ...state, error: action.message, loading: false };
    case 'LOAD_ALL':     return { ...state, threads: action.threads, rituals: action.rituals, streaks: action.streaks, doneDates: action.doneDates, scratches: action.scratches, loading: false };
    case 'SET_SECTION':  return { ...state, section: action.section, activeThreadId: action.threadId ?? state.activeThreadId };
    case 'OPEN_THREAD':  return { ...state, section: 'thread', activeThreadId: action.threadId };
    case 'UPDATE_THREAD': {
      const threads = state.threads.map(t => t.id === action.thread.id ? action.thread : t);
      return { ...state, threads };
    }
    case 'ADD_THREAD':   return { ...state, threads: [action.thread, ...state.threads] };
    case 'SET_RITUALS':  return { ...state, rituals: action.rituals, streaks: action.streaks, doneDates: action.doneDates };
    case 'SET_SCRATCHES': return { ...state, scratches: action.scratches };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INIT);

  // ── Load all data from disk ─────────────────────────────────────────────
  const loadAll = useCallback(async (handle) => {
    try {
      await ensureDir(handle, 'threads');

      // Collect files from threads/ subdir and root (for files created outside the app)
      const [subFiles, rootFiles] = await Promise.all([
        listFiles(handle, 'threads'),
        listRootFiles(handle),
      ]);
      const reservedNames = new Set(['rituals.md', 'scratch.md']);
      const rootThreadFiles = rootFiles.filter(f => !reservedNames.has(f.name));

      const threads = [];
      const seen = new Set();

      for (const { name, inRoot } of [
        ...subFiles.map(f => ({ ...f, inRoot: false })),
        ...rootThreadFiles.map(f => ({ ...f, inRoot: true })),
      ]) {
        if (seen.has(name)) continue;
        seen.add(name);
        try {
          const path = inRoot ? name : `threads/${name}`;
          const raw = await readFile(handle, path);
          const { meta, blocks } = parseThread(raw);
          const slug = name.replace('.md', '');
          threads.push({ id: slug, slug, filename: name, inRoot, ...meta, blocks });
        } catch (e) {
          console.warn('Failed to parse', name, e);
        }
      }
      threads.sort((a, b) => new Date(b.created) - new Date(a.created));

      // Rituals
      let ritualsData = { rituals: [], streaks: {}, doneDates: {} };
      try {
        const raw = await readFile(handle, 'rituals.md');
        ritualsData = parseRituals(raw);
      } catch { /* file may not exist yet */ }

      // Scratch
      let scratches = [];
      try {
        const raw = await readFile(handle, 'scratch.md');
        scratches = parseScratch(raw);
      } catch { /* file may not exist yet */ }

      dispatch({ type: 'LOAD_ALL', threads, ...ritualsData, scratches });
    } catch (e) {
      dispatch({ type: 'SET_ERROR', message: e.message });
    }
  }, []);

  // ── Pick directory ──────────────────────────────────────────────────────
  const pickDirectory = useCallback(async () => {
    try {
      const handle = await openDirectory();
      dispatch({ type: 'SET_DIR', handle });
      await loadAll(handle);
    } catch (e) {
      // User cancelled picker or permission denied — not an error worth surfacing
      if (e.name !== 'AbortError') {
        dispatch({ type: 'SET_ERROR', message: e.message });
      }
    }
  }, [loadAll]);

  // ── Restore directory on mount ──────────────────────────────────────────
  const tryRestore = useCallback(async () => {
    try {
      const handle = await restoreDirectory();
      if (handle) {
        dispatch({ type: 'SET_DIR', handle });
        await loadAll(handle);
      } else {
        dispatch({ type: 'SET_LOADING', value: false });
      }
    } catch (e) {
      dispatch({ type: 'SET_LOADING', value: false });
      console.warn('Failed to restore directory:', e);
    }
  }, [loadAll]);

  // ── Rescan directory ────────────────────────────────────────────────────
  const rescanDirectory = useCallback(async () => {
    const { dirHandle } = state;
    if (!dirHandle) return;
    dispatch({ type: 'SET_LOADING', value: true });
    await loadAll(dirHandle);
  }, [state, loadAll]);

  // ── Navigation ──────────────────────────────────────────────────────────
  const setSection = useCallback((section, threadId) => {
    dispatch({ type: 'SET_SECTION', section, threadId });
  }, []);

  const openThread = useCallback((threadId) => {
    dispatch({ type: 'OPEN_THREAD', threadId });
  }, []);

  // ── Create thread ───────────────────────────────────────────────────────
  const createThread = useCallback(async ({ title, kind, tags, people }) => {
    const { dirHandle } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const slug = generateSlug(title) + '-' + nanoid(4);
      const meta = { title, kind: kind || 'project', status: 'active', tags: tags || [], people: people || [], created: new Date().toISOString() };
      const thread = { id: slug, slug, filename: `${slug}.md`, ...meta, blocks: [] };
      dispatch({ type: 'ADD_THREAD', thread });
      dispatch({ type: 'OPEN_THREAD', threadId: slug });
      return thread;
    }
    const slug = generateSlug(title) + '-' + nanoid(4);
    const meta = { title, kind: kind || 'project', status: 'active', tags: tags || [], people: people || [], created: new Date().toISOString() };
    const blocks = [];
    const raw = serializeThread(meta, blocks);
    await writeFile(dirHandle, `threads/${slug}.md`, raw);
    const thread = { id: slug, slug, filename: `${slug}.md`, ...meta, blocks };
    dispatch({ type: 'ADD_THREAD', thread });
    dispatch({ type: 'OPEN_THREAD', threadId: slug });
    return thread;
  }, [state]);

  // ── Add block to thread ─────────────────────────────────────────────────
  const addBlock = useCallback(async (threadId, block) => {
    const { dirHandle, threads } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;
      const newBlock = { ...block, date: block.date || today(), id: block.id || (block.type.toLowerCase().slice(0,3) + '-' + nanoid(6)) };
      dispatch({ type: 'UPDATE_THREAD', thread: { ...thread, blocks: [...thread.blocks, newBlock] } });
      return;
    }
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    const newBlock = { ...block, date: block.date || today(), id: block.id || (block.type.toLowerCase().slice(0,3) + '-' + nanoid(6)) };
    const updatedThread = { ...thread, blocks: [...thread.blocks, newBlock] };
    await writeFile(dirHandle, thread.inRoot ? thread.filename : `threads/${thread.filename}`, serializeThread(updatedThread, updatedThread.blocks));
    dispatch({ type: 'UPDATE_THREAD', thread: updatedThread });
  }, [state]);

  // ── Update a block ──────────────────────────────────────────────────────
  const updateBlock = useCallback(async (threadId, blockId, changes) => {
    const { dirHandle, threads } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;
      const blocks = thread.blocks.map(b => b.id === blockId ? { ...b, ...changes } : b);
      dispatch({ type: 'UPDATE_THREAD', thread: { ...thread, blocks } });
      return;
    }
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    const blocks = thread.blocks.map(b => b.id === blockId ? { ...b, ...changes } : b);
    const updatedThread = { ...thread, blocks };
    await writeFile(dirHandle, thread.inRoot ? thread.filename : `threads/${thread.filename}`, serializeThread(updatedThread, blocks));
    dispatch({ type: 'UPDATE_THREAD', thread: updatedThread });
  }, [state]);

  // ── Update thread meta ──────────────────────────────────────────────────
  const updateThread = useCallback(async (threadId, changes) => {
    const { dirHandle, threads } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const thread = threads.find(t => t.id === threadId);
      if (!thread) return;
      dispatch({ type: 'UPDATE_THREAD', thread: { ...thread, ...changes } });
      return;
    }
    const thread = threads.find(t => t.id === threadId);
    if (!thread) return;
    const updatedThread = { ...thread, ...changes };
    await writeFile(dirHandle, thread.inRoot ? thread.filename : `threads/${thread.filename}`, serializeThread(updatedThread, updatedThread.blocks));
    dispatch({ type: 'UPDATE_THREAD', thread: updatedThread });
  }, [state]);

  // ── Toggle ritual done for today ────────────────────────────────────────
  const toggleRitual = useCallback(async (ritualId) => {
    const { dirHandle, rituals, streaks, doneDates } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const t = today();
      const newDoneDates = { ...doneDates, [ritualId]: new Set(doneDates[ritualId] || []) };
      const newStreaks = { ...streaks };
      if (newDoneDates[ritualId].has(t)) {
        newDoneDates[ritualId].delete(t);
        newStreaks[ritualId] = (newStreaks[ritualId] || []).filter(d => d !== t);
      } else {
        newDoneDates[ritualId].add(t);
        newStreaks[ritualId] = [...(newStreaks[ritualId] || []), t];
      }
      dispatch({ type: 'SET_RITUALS', rituals, streaks: newStreaks, doneDates: newDoneDates });
      return;
    }
    const t = today();
    const newDoneDates = { ...doneDates };
    const newStreaks = { ...streaks };
    if (!newDoneDates[ritualId]) newDoneDates[ritualId] = new Set();
    if (newDoneDates[ritualId].has(t)) {
      newDoneDates[ritualId].delete(t);
      newStreaks[ritualId] = (newStreaks[ritualId] || []).filter(d => d !== t);
    } else {
      newDoneDates[ritualId].add(t);
      newStreaks[ritualId] = [...(newStreaks[ritualId] || []), t];
    }
    const raw = serializeRituals(rituals, newStreaks, newDoneDates);
    await writeFile(dirHandle, 'rituals.md', raw);
    dispatch({ type: 'SET_RITUALS', rituals, streaks: newStreaks, doneDates: newDoneDates });
  }, [state]);

  // ── Toggle ritual pinned ────────────────────────────────────────────────
  const toggleRitualPin = useCallback(async (ritualId) => {
    const { dirHandle, rituals, streaks, doneDates } = state;
    if (!dirHandle) return;
    const newRituals = rituals.map(r => r.id === ritualId ? { ...r, pinned: !r.pinned } : r);
    if (IS_DEMO) {
      dispatch({ type: 'SET_RITUALS', rituals: newRituals, streaks, doneDates });
      return;
    }
    const raw = serializeRituals(newRituals, streaks, doneDates);
    await writeFile(dirHandle, 'rituals.md', raw);
    dispatch({ type: 'SET_RITUALS', rituals: newRituals, streaks, doneDates });
  }, [state]);

  // ── Add ritual ──────────────────────────────────────────────────────────
  const addRitual = useCallback(async ({ label, detail }) => {
    const { dirHandle, rituals, streaks, doneDates } = state;
    if (!dirHandle) return;
    const r = { id: 'r-' + nanoid(6), label, detail: detail || '' };
    const newRituals = [...rituals, r];
    const raw = serializeRituals(newRituals, streaks, doneDates);
    await writeFile(dirHandle, 'rituals.md', raw);
    dispatch({ type: 'SET_RITUALS', rituals: newRituals, streaks, doneDates });
  }, [state]);

  // ── Add scratch ─────────────────────────────────────────────────────────
  const addScratch = useCallback(async (text) => {
    const { dirHandle, scratches } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      const s = { id: 's-' + nanoid(6), created: new Date().toISOString(), text, threadId: 'unassigned' };
      dispatch({ type: 'SET_SCRATCHES', scratches: [s, ...scratches] });
      return;
    }
    const s = { id: 's-' + nanoid(6), created: new Date().toISOString(), text, threadId: 'unassigned' };
    const newScratches = [s, ...scratches];
    await writeFile(dirHandle, 'scratch.md', serializeScratch(newScratches));
    dispatch({ type: 'SET_SCRATCHES', scratches: newScratches });
  }, [state]);

  // ── Assign scratch to thread ────────────────────────────────────────────
  const assignScratch = useCallback(async (scratchId, threadId) => {
    const { dirHandle, scratches } = state;
    if (!dirHandle) return;
    const newScratches = scratches.map(s => s.id === scratchId ? { ...s, threadId } : s);
    await writeFile(dirHandle, 'scratch.md', serializeScratch(newScratches));
    dispatch({ type: 'SET_SCRATCHES', scratches: newScratches });
  }, [state]);

  // ── Delete scratch ──────────────────────────────────────────────────────
  const deleteScratch = useCallback(async (scratchId) => {
    const { dirHandle, scratches } = state;
    if (!dirHandle) return;
    if (IS_DEMO) {
      dispatch({ type: 'SET_SCRATCHES', scratches: scratches.filter(s => s.id !== scratchId) });
      return;
    }
    const newScratches = scratches.filter(s => s.id !== scratchId);
    await writeFile(dirHandle, 'scratch.md', serializeScratch(newScratches));
    dispatch({ type: 'SET_SCRATCHES', scratches: newScratches });
  }, [state]);

  // ── Derived data helpers ────────────────────────────────────────────────
  const getAllFollowups = useCallback(() => {
    return state.threads.flatMap(t =>
      t.blocks.filter(b => b.type === 'FOLLOWUP' && b.state !== 'closed')
        .map(b => ({ ...b, threadTitle: t.title, threadId: t.id }))
    );
  }, [state.threads]);

  const getAllDecisions = useCallback(() => {
    return state.threads.flatMap(t =>
      t.blocks.filter(b => b.type === 'DECISION')
        .map(b => ({ ...b, threadTitle: t.title, threadId: t.id }))
    ).slice(0, 8);
  }, [state.threads]);

  const getAllQuestions = useCallback(() => {
    return state.threads.flatMap(t =>
      t.blocks.filter(b => b.type === 'QUESTION')
        .map(b => ({ ...b, threadTitle: t.title, threadId: t.id }))
    );
  }, [state.threads]);

  const getPeopleIndex = useCallback(() => {
    const idx = {};
    for (const t of state.threads) {
      for (const b of t.blocks) {
        if (b.type !== 'FOLLOWUP' || !b.who) continue;
        if (!idx[b.who]) idx[b.who] = { name: b.who, owe: 0, theyOwe: 0, threads: new Set(), lastTouched: '' };
        const entry = idx[b.who];
        entry.threads.add(t.title);
        if (!entry.lastTouched || b.date > entry.lastTouched) entry.lastTouched = b.date;
        if (b.state === 'waiting') entry.theyOwe++;
        if (b.state === 'open' && b.who !== 'me') entry.owe++;
      }
    }
    return Object.values(idx).map(e => ({ ...e, threads: [...e.threads] }));
  }, [state.threads]);

  const getRitualStreak = useCallback((ritualId) => {
    return computeStreak(state.streaks[ritualId] || []);
  }, [state.streaks]);

  const isRitualDoneToday = useCallback((ritualId) => {
    return !!(state.doneDates[ritualId]?.has(today()));
  }, [state.doneDates]);

  // Load demo data on mount when ?demo=1
  useEffect(() => {
    if (IS_DEMO) {
      // Dispatch both together: dirHandle='demo' + all data loaded
      dispatch({ type: 'SET_DIR', handle: 'demo' });
      dispatch({
        type: 'LOAD_ALL',
        threads: DEMO_THREADS,
        rituals: DEMO_RITUALS,
        streaks: DEMO_STREAKS,
        doneDates: DEMO_DONE_DATES,
        scratches: DEMO_SCRATCHES,
      });
    }
  }, []);

  const value = {
    ...state,
    pickDirectory,
    tryRestore,
    rescanDirectory,
    setSection,
    openThread,
    createThread,
    addBlock,
    updateBlock,
    updateThread,
    toggleRitual,
    toggleRitualPin,
    addRitual,
    addScratch,
    assignScratch,
    deleteScratch,
    getAllFollowups,
    getAllDecisions,
    getAllQuestions,
    getPeopleIndex,
    getRitualStreak,
    isRitualDoneToday,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
