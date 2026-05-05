import { useEffect, useState } from 'react';
import AdminForm from './components/AdminForm';
import CustomerView from './components/CustomerView';
import PasswordPrompt from './components/PasswordPrompt';
import { decryptOrder } from './lib/crypto';
import type { OrderData } from './types';

export default function App() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [encrypted, setEncrypted] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get('e');
    if (e) setEncrypted(e);
  }, []);

  const handleUnlock = async (password: string): Promise<boolean> => {
    if (!encrypted) return false;
    const decrypted = await decryptOrder(encrypted, password);
    if (!decrypted) return false;
    setOrder(decrypted);
    return true;
  };

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
