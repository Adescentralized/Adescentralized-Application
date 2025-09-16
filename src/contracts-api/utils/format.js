import { randomBytes, createHash } from 'node:crypto';

export function safeJSON(t) {
  try { return JSON.parse(t); } catch { return null; }
}

export function toBytes32Hex(input) {
  if (!input) return randomBytes(32).toString('hex');
  const hexRe = /^[0-9a-fA-F]{64}$/;
  if (hexRe.test(input)) return input.toLowerCase();
  return createHash('sha256').update(String(input)).digest('hex');
}

export function ensureAddr(s) {
  if (typeof s !== 'string' || !/^G[A-Z0-9]{10,}$/.test(s)) {
    throw new Error('address inválido (esperado G...)');
  }
  return s;
}

export function sym(s) {
  return String(s || '').toLowerCase() || 'click';
}
