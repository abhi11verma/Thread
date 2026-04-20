// File System Access API wrapper
// Persists the directory handle in IndexedDB so it survives page refresh.

const DB_NAME = 'thread-app';
const DB_VERSION = 1;
const STORE = 'handles';
const DIR_KEY = 'workingDir';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandle(handle) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(handle, DIR_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function loadHandle() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(DIR_KEY);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

/** Show the OS directory picker and persist the handle. */
export async function openDirectory() {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' });
  await saveHandle(handle);
  return handle;
}

/** Restore a previously-chosen directory handle (may need re-permission). */
export async function restoreDirectory() {
  const handle = await loadHandle();
  if (!handle) return null;
  // Verify permission (user may need to re-grant on refresh)
  const perm = await handle.queryPermission({ mode: 'readwrite' });
  if (perm === 'granted') return handle;
  const req = await handle.requestPermission({ mode: 'readwrite' });
  return req === 'granted' ? handle : null;
}

/** Ensure a sub-directory exists, return its handle. */
export async function ensureDir(dirHandle, name) {
  return dirHandle.getDirectoryHandle(name, { create: true });
}

/** List all .md files in a sub-directory. Returns array of { name, handle }. */
export async function listFiles(dirHandle, subdir) {
  let sub;
  try {
    sub = await dirHandle.getDirectoryHandle(subdir);
  } catch {
    return [];
  }
  const files = [];
  for await (const [name, handle] of sub.entries()) {
    if (handle.kind === 'file' && name.endsWith('.md')) {
      files.push({ name, handle });
    }
  }
  return files;
}

/** List all .md files directly in the root dirHandle (non-recursive). */
export async function listRootFiles(dirHandle) {
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind === 'file' && name.endsWith('.md')) {
      files.push({ name, handle });
    }
  }
  return files;
}

/** Read text content of a file. path is relative: e.g. 'threads/foo.md' or 'rituals.md' */
export async function readFile(dirHandle, path) {
  const parts = path.split('/');
  let cur = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = await cur.getDirectoryHandle(parts[i]);
  }
  const fileHandle = await cur.getFileHandle(parts[parts.length - 1]);
  const file = await fileHandle.getFile();
  return file.text();
}

/** Write text content to a file (creates if missing). */
export async function writeFile(dirHandle, path, text) {
  const parts = path.split('/');
  let cur = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = await cur.getDirectoryHandle(parts[i], { create: true });
  }
  const fileHandle = await cur.getFileHandle(parts[parts.length - 1], { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(text);
  await writable.close();
}

/** Delete a file. */
export async function deleteFile(dirHandle, path) {
  const parts = path.split('/');
  let cur = dirHandle;
  for (let i = 0; i < parts.length - 1; i++) {
    cur = await cur.getDirectoryHandle(parts[i]);
  }
  await cur.removeEntry(parts[parts.length - 1]);
}
