// Tiny nanoid replacement (no dependency needed)
const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
export function nanoid(len = 8) {
  let s = '';
  const arr = crypto.getRandomValues(new Uint8Array(len));
  for (const v of arr) s += CHARS[v % CHARS.length];
  return s;
}
