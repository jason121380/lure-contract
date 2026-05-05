import type { OrderData } from '../types';

const VERSION = 0x01;
const PBKDF2_ITERATIONS = 250_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const GCM_TAG_BYTES = 16;
const KEY_BITS = 256;

async function deriveKey(password: string, salt: BufferSource): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password) as BufferSource,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: KEY_BITS },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToBase64url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function encryptOrder(order: OrderData, password: string): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(order)) as BufferSource;
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt as BufferSource);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, plaintext)
  );

  const out = new Uint8Array(1 + SALT_BYTES + IV_BYTES + ciphertext.length);
  out[0] = VERSION;
  out.set(salt, 1);
  out.set(iv, 1 + SALT_BYTES);
  out.set(ciphertext, 1 + SALT_BYTES + IV_BYTES);
  return bytesToBase64url(out);
}

export async function decryptOrder(encoded: string, password: string): Promise<OrderData | null> {
  try {
    const bytes = base64urlToBytes(encoded);
    if (bytes.length < 1 + SALT_BYTES + IV_BYTES + GCM_TAG_BYTES) return null;
    if (bytes[0] !== VERSION) return null;
    const salt = bytes.slice(1, 1 + SALT_BYTES);
    const iv = bytes.slice(1 + SALT_BYTES, 1 + SALT_BYTES + IV_BYTES);
    const ciphertext = bytes.slice(1 + SALT_BYTES + IV_BYTES);
    const key = await deriveKey(password, salt as BufferSource);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    return JSON.parse(new TextDecoder().decode(plaintext)) as OrderData;
  } catch {
    return null;
  }
}

export function buildSigningUrl(encoded: string): string {
  const url = new URL(window.location.href);
  url.search = `?e=${encoded}`;
  url.hash = '';
  return url.toString();
}
