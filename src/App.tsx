import { useEffect, useState } from 'react';
import AdminForm from './components/AdminForm';
import CustomerView from './components/CustomerView';
import PasswordPrompt from './components/PasswordPrompt';
import { decryptOrder } from './lib/crypto';
import { fetchShortLink } from './lib/shortener';
import type { OrderData } from './types';

type LinkState = 'admin' | 'loading' | 'ready' | 'error';

export default function App() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [encrypted, setEncrypted] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>('admin');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('e');
    const k = params.get('k');
    if (e) {
      setEncrypted(e);
      setLinkState('ready');
      return;
    }
    if (k) {
      setLinkState('loading');
      fetchShortLink(k)
        .then((blob) => {
          setEncrypted(blob);
          setLinkState('ready');
        })
        .catch((err) => {
          setLinkError(err instanceof Error ? err.message : '載入失敗');
          setLinkState('error');
        });
    }
  }, []);

  const handleUnlock = async (password: string): Promise<boolean> => {
    if (!encrypted) return false;
    const decrypted = await decryptOrder(encrypted, password);
    if (!decrypted) return false;
    setOrder(decrypted);
    return true;
  };

  if (linkState === 'loading') {
    return (
      <div className="link-loading-wrap">
        <div className="link-loading-card">
          <div className="spinner" />
          <p>載入中…</p>
        </div>
      </div>
    );
  }

  if (linkState === 'error') {
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
      {encrypted && !order ? (
        <PasswordPrompt onUnlock={handleUnlock} />
      ) : order ? (
        <CustomerView order={order} />
      ) : (
        <AdminForm />
      )}
    </div>
  );
}
