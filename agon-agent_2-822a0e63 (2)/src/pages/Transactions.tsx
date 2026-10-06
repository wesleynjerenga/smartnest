import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowDownToLine, ArrowUpFromLine, ShoppingCart, CircleDollarSign, Gift } from 'lucide-react';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetch(`/api/transactions?user_id=${user.id}`).then(r => r.json()).then(d => { setTransactions(d); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const filtered = filter === 'all' ? transactions : transactions.filter((t: any) => filter === 'referral' ? ['referral_bonus', 'referral_weekly'].includes(t.type) : t.type === filter);
  const iconMap: Record<string, any> = { deposit: ArrowDownToLine, withdrawal: ArrowUpFromLine, sale: ShoppingCart, referral_bonus: Gift, referral_weekly: Gift };
  const colorMap: Record<string, string> = { deposit: 'text-brand-500', withdrawal: 'text-danger-500', sale: 'text-info-500', referral_bonus: 'text-brand-500', referral_weekly: 'text-brand-500' };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-snow">Transaction History</h1><p className="text-muted text-sm">All your financial transactions</p></div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ v: 'all', l: 'All' }, { v: 'deposit', l: 'Deposits' }, { v: 'withdrawal', l: 'Withdrawals' }, { v: 'sale', l: 'Sales' }, { v: 'referral', l: 'Referral rewards' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${filter === f.v ? 'bg-brand-600 text-snow' : 'bg-navy-900 text-silver hover:bg-navy-800'}`}>{f.l}</button>
        ))}
      </div>

      <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-navy-900"><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Type</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Description</th><th className="px-4 py-3 text-right text-xs font-medium text-muted uppercase">Amount</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Status</th></tr></thead>
            <tbody className="divide-y divide-navy-800">
              {filtered.map((tx: any) => {
                const Icon = iconMap[tx.type] || CircleDollarSign;
                const color = colorMap[tx.type] || 'text-silver';
                return (
                  <tr key={tx.id} className="hover:bg-navy-800">
                    <td className="px-4 py-3 text-snow whitespace-nowrap">{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 ${color}`}><Icon className="w-3.5 h-3.5" />{tx.type}</span></td>
                    <td className="px-4 py-3 text-silver max-w-xs truncate">{tx.description}</td>
                    <td className={`px-4 py-3 text-right font-medium ${color}`}>KSh {parseFloat(tx.amount).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${tx.status === 'completed' ? 'bg-brand-100 text-brand-500' : tx.status === 'pending' ? 'bg-warn-100 text-warn-500' : 'bg-danger-100 text-danger-500'}`}>{tx.status}</span></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No transactions found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}