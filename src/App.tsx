import { useEffect, useRef, useState } from 'react';
import AdminForm from './components/AdminForm';
import CustomerView from './components/CustomerView';
import PasswordPrompt from './components/PasswordPrompt';
import { decryptOrder } from './lib/crypto';
import { fetchShortLink } from './lib/shortener';
import type { OrderData } from './types';

type Mode = 'admin' | 'customer' | 'error';

export default function App() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [mode, setMode] = useState<Mode>('admin');
  const [linkError, setLinkError] = useState('');
  const blobRef = useRef<Promise<string> | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('e');
    const k = params.get('k');
    if (e) {
      blobRef.current = Promise.resolve(e);
      setMode('customer');
      return;
    }
    if (k) {
      // Show password prompt immediately; fetch blob in the background so
      // the user can start typing while the round-trip completes.
      blobRef.current = fetchShortLink(k);
      blobRef.current.catch((err) => {
        setLinkError(err instanceof Error ? err.message : '載入失敗');
        setMode('error');
      });
      setMode('customer');
    }
  }, []);

  const handleUnlock = async (password: string): Promise<boolean> => {
    if (!blobRef.current) return false;
    let blob: string;
    try {
      blob = await blobRef.current;
    } catch {
      return false;
    }
    const decrypted = await decryptOrder(blob, password);
    if (!decrypted) return false;
    setOrder(decrypted);
    return true;
  };

  if (mode === 'error') {
    return (
      <div className="link-loading-wrap">
        <div className="link-loading-card">
          <h2>無法開啟連結</h2>
          <p>{linkError}</p>
          <p>請聯絡承辦人重新發送連結。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {mode === 'customer' && !order ? (
        <PasswordPrompt onUnlock={handleUnlock} />
      ) : order ? (
        <CustomerView order={order} />
      ) : (
        <AdminForm />
      )}
    </div>
  );
}
