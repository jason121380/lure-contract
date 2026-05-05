import type { OrderData } from '../types';

// URL-safe base64 of a JSON-encoded order, for embedding the pre-filled data
// in the signing link the staff sends to the customer.
export function encodeOrder(order: OrderData): string {
  const json = JSON.stringify(order);
  const utf8 = new TextEncoder().encode(json);
  let binary = '';
  utf8.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeOrder(encoded: string): OrderData | null {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as OrderData;
  } catch {
    return null;
  }
}

export function buildSigningUrl(encoded: string): string {
  const url = new URL(window.location.href);
  url.search = `?d=${encoded}`;
  url.hash = '';
  return url.toString();
}
