import { useState, type FormEvent } from 'react';

interface Props {
  onUnlock: (password: string) => Promise<boolean>;
}

export default function PasswordPrompt({ onUnlock }: Props) {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setError(false);
    const ok = await onUnlock(password);
    if (!ok) {
      setError(true);
      setSubmitting(false);
      setPassword('');
    }
  };

  return (
    <div className="password-wrap">
      <form className="password-card" onSubmit={submit}>
        <h1>請輸入連結密碼</h1>
        <p>這份委刊單已加密，請輸入承辦人提供的密碼以開啟。</p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="密碼"
        />
        {error && <p className="error">密碼錯誤，請再試一次</p>}
        <button type="submit" className="primary" disabled={!password || submitting}>
          {submitting ? '驗證中…' : '開啟委刊單'}
        </button>
      </form>
    </div>
  );
}
