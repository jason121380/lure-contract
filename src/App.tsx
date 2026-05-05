import { useEffect, useState } from 'react';
import AdminForm from './components/AdminForm';
import CustomerView from './components/CustomerView';
import { decodeOrder } from './lib/encoding';
import type { OrderData } from './types';

export default function App() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [mode, setMode] = useState<'admin' | 'customer'>('admin');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const d = params.get('d');
    if (d) {
      const parsed = decodeOrder(d);
      if (parsed) {
        setOrder(parsed);
        setMode('customer');
        return;
      }
    }
    setMode('admin');
  }, []);

  return (
    <div className="app">
      {mode === 'customer' && order ? <CustomerView order={order} /> : <AdminForm />}
    </div>
  );
}
