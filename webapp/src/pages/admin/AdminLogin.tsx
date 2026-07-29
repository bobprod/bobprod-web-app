import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../lib/useAdminAuth';

export default function AdminLogin() {
  const { isAuthenticated, login } = useAdminAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/admin" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.045] p-8 backdrop-blur-md"
      >
        <p className="font-display mb-6 text-center text-xl text-white">bobprod admin</p>
        <div className="mb-4">
          <label htmlFor="username" className="mb-1 block text-xs text-white/55">
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
          />
        </div>
        <div className="mb-5">
          <label htmlFor="password" className="mb-1 block text-xs text-white/55">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-sm text-white"
          />
        </div>
        {error && <p className="mb-4 text-xs text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] px-4 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
