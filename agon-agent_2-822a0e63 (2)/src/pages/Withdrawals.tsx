import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { ArrowUpFromLine, Plus, X, AlertCircle, Info } from 'lucide-react';

const MIN_WITHDRAWAL = 200;

export default function Withdrawals() {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('M-Pesa');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchWithdrawals = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/withdrawals?user_id=${user.id}`);
      setWithdrawals(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchWithdrawals(); }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side minimum validation
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < MIN_WITHDRAWAL) {
      setError(`Minimum withdrawal amount is KSh ${MIN_WITHDRAWAL}`);
      return;
    }

    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount, method, phone }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit withdrawal');
      }
      setShowForm(false); setAmount(''); setPhone('');
      fetchWithdrawals();
    } catch (err: any) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const statusBadge = (s: string) => {
    const cls = s === 'approved' ? 'bg-brand-100 text-brand-500' : s === 'pending' ? 'bg-warn-100 text-warn-500' : 'bg-danger-100 text-danger-500';
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{s}</span>;
  };

  const numAmount = parseFloat(amount) || 0;
  const isBelowMin = numAmount > 0 && numAmount < MIN_WITHDRAWAL;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-snow">Withdrawals</h1>
          <p className="text-muted text-sm">Request and track withdrawals</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-snow text-sm font-medium hover:bg-brand-700 transition btn-press">
          <Plus className="w-4 h-4" /> New Withdrawal
        </button>
      </div>

      {/* Minimum withdrawal info banner */}
      <div className="mb-6 p-3.5 rounded-xl bg-navy-900 border border-navy-800 flex items-center gap-3">
        <Info className="w-4 h-4 text-brand-500 shrink-0" />
        <p className="text-sm text-silver">Minimum Withdrawal: <span className="font-bold text-snow">KSh {MIN_WITHDRAWAL}</span> · Withdrawals are processed within 24–48 hours after admin approval.</p>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-snow">Request Withdrawal</h2>
            <button onClick={() => { setShowForm(false); setError(''); }} className="text-muted hover:text-snow"><X className="w-5 h-5" /></button>
          </div>

          {/* Minimum info in form */}
          <div className="mb-4 p-3 rounded-lg bg-brand-100/30 border border-brand-600/20 text-sm text-brand-500">
            Minimum withdrawal amount: <span className="font-bold">KSh {MIN_WITHDRAWAL}</span>
          </div>

          <form onSubmit={handleSubmit} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Amount (KSh)</label>
              <input
                type="number"
                min={MIN_WITHDRAWAL}
                value={amount}
                onChange={e => { setAmount(e.target.value); setError(''); }}
                required
                className={`w-full px-3 py-2.5 rounded-lg border bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600 ${isBelowMin ? 'border-warn-500' : 'border-navy-800'}`}
                placeholder={`Min KSh ${MIN_WITHDRAWAL}`}
              />
              {isBelowMin && (
                <p className="mt-1 text-xs text-warn-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Amount must be at least KSh {MIN_WITHDRAWAL}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Method</label>
              <select value={method} onChange={e => setMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600">
                <option>M-Pesa</option><option>Airtel Money</option><option>Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Phone</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" placeholder="+2547XXXXXXXX" />
            </div>
            {error && <div className="sm:col-span-3 p-2.5 rounded-lg bg-danger-100/30 text-danger-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={submitting || isBelowMin || !amount}
                className="px-6 py-2.5 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm btn-press"
              >
                {submitting ? 'Processing...' : 'Submit Request'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-navy-900"><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Amount</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Method</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-navy-800">
              {withdrawals.map((w: any) => (
                <tr key={w.id} className="hover:bg-navy-800 transition">
                  <td className="px-4 py-3 text-snow">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-snow">KSh {parseFloat(w.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-silver">{w.method}</td>
                  <td className="px-4 py-3">{statusBadge(w.status)}</td>
                </tr>
              ))}
              {withdrawals.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted">No withdrawals yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
