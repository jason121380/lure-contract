import { SUBMISSION_ENDPOINT_URL } from '../config';

const ID_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomShortId(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let s = '';
  for (let i = 0; i < len; i++) s += ID_CHARS[bytes[i] % ID_CHARS.length];
  return s;
}

export function buildShortSigningUrl(id: string): string {
  const url = new URL(window.location.href);
  url.search = `?k=${id}`;
  url.hash = '';
  return url.toString();
}

export async function storeShortLink(id: string, blob: string): Promise<void> {
  if (!SUBMISSION_ENDPOINT_URL) {
    throw new Error('尚未設定 SUBMISSION_ENDPOINT_URL');
  }
  await fetch(SUBMISSION_ENDPOINT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action: 'shorten', id, blob })
  });
}

export function fetchShortLink(id: string): Promise<string> {
  if (!SUBMISSION_ENDPOINT_URL) {
    return Promise.reject(new Error('尚未設定 SUBMISSION_ENDPOINT_URL'));
  }
  return new Promise((resolve, reject) => {
    const cbName = `__lc_cb_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
    const script = document.createElement('script');
    let timer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      delete (window as unknown as Record<string, unknown>)[cbName];
      script.remove();
    };

    (window as unknown as Record<string, unknown>)[cbName] = (
      data: { blob?: string } | undefined
    ) => {
      cleanup();
      if (data && data.blob) resolve(data.blob);
      else reject(new Error('連結不存在或已過期'));
    };

    script.src =
      `${SUBMISSION_ENDPOINT_URL}?k=${encodeURIComponent(id)}` +
      `&callback=${cbName}`;
    script.onerror = () => {
      cleanup();
      reject(new Error('短連結伺服器無法連線'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('短連結載入逾時'));
    }, 15000);

    document.head.appendChild(script);
  });
}
