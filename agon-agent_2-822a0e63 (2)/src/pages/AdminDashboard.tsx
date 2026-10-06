import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { Users, ArrowDownToLine, TrendingUp, ArrowUpFromLine, ShoppingCart, CheckCircle, XCircle, Search, Wheat, Settings, Gift, Lock, Timer, Eye, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Tab = 'overview' | 'deposits' | 'withdrawals' | 'users' | 'packages' | 'sales' | 'feeding' | 'referrals' | 'claims';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

interface ConfirmAction {
  type: 'approve' | 'reject';
  target: 'deposit' | 'withdrawal';
  id: number;
  itemName: string;
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<any>({});
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [feedingData, setFeedingData] = useState<any[]>([]);
  const [claimsData, setClaimsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [depFilter, setDepFilter] = useState<StatusFilter>('all');
  const [withFilter, setWithFilter] = useState<StatusFilter>('all');
  const [detailItem, setDetailItem] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState<string|null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction|null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');

  const [refConfig, setRefConfig] = useState<any>({ levels: [
    { level: 1, members: 8, weekly_payment: 300 },
    { level: 2, members: 15, weekly_payment: 800 },
    { level: 3, members: 24, weekly_payment: 1500 },
  ] });

  const authHeaders = () => {
    const h: any = {};
    if (session?.access_token) h['Authorization'] = `Bearer ${session.access_token}`;
    return h;
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { success: false, error: `Server returned non-JSON response (${res.status})` }; }
  };

  const fetchAll = async () => {
    try {
      const [statsRes, depRes, withRes, usersRes, pkgRes, salesRes, feedRes, refRes, claimsRes] = await Promise.all([
        fetch('/api/admin?action=stats', { headers: authHeaders() }),
        fetch('/api/admin?action=deposits', { headers: authHeaders() }),
        fetch('/api/admin?action=withdrawals', { headers: authHeaders() }),
        fetch('/api/admin?action=users', { headers: authHeaders() }),
        fetch('/api/packages'),
        fetch('/api/admin?action=sales', { headers: authHeaders() }),
        fetch('/api/admin?action=feeding', { headers: authHeaders() }),
        fetch('/api/referrals?action=config', { headers: authHeaders() }),
        fetch('/api/admin?action=claims', { headers: authHeaders() }),
      ]);
      setStats(await safeJson(statsRes));
      setDeposits(await safeJson(depRes));
      setWithdrawals(await safeJson(withRes));
      setUsers(await safeJson(usersRes));
      setPackages(await safeJson(pkgRes));
      setSalesData(await safeJson(salesRes));
      setFeedingData(await safeJson(feedRes));
      const refData = await safeJson(refRes);
      if (refData && !refData.error) setRefConfig(refData);
      setClaimsData(await safeJson(claimsRes));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const executeAction = async (action: ConfirmAction, reason: string) => {
    const key = `${action.target}-${action.id}`;
    setActionLoading(key);
    setActionError('');
    try {
      const endpoint = action.target === 'deposit' ? '/api/deposits' : '/api/withdrawals';
      const body: any = { id: action.id, status: action.type === 'approve' ? 'approved' : 'rejected' };
      if (action.type === 'reject' && reason) body.admin_note = reason;

      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });
      const result = await safeJson(res);
      if (!res.ok || result.error) {
        setActionError(result.error || `Failed to ${action.type} transaction`);
        return;
      }
      setConfirmAction(null);
      setRejectReason('');
      fetchAll();
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const updatePackage = async (id: number, updates: any) => {
    await fetch('/api/packages', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const fmt = (n: number) => 'KSh ' + Math.round(n).toLocaleString();
  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: TrendingUp },
    { key: 'deposits', label: 'Deposits', icon: ArrowDownToLine },
    { key: 'withdrawals', label: 'Withdrawals', icon: ArrowUpFromLine },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'packages', label: 'Packages', icon: ShoppingCart },
    { key: 'sales', label: 'Sales', icon: ShoppingCart },
    { key: 'feeding', label: 'Feeding', icon: Wheat },
    { key: 'referrals', label: 'Referrals', icon: Users },
    { key: 'claims', label: 'Claims', icon: Gift },
  ];

  const statusBadge = (s: string) => {
    const cls = s === 'approved' || s === 'completed' ? 'bg-brand-100 text-brand-500' : s === 'pending' ? 'bg-warn-100 text-warn-500' : 'bg-danger-100 text-danger-500';
    return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{s}</span>;
  };

  const filteredDeps = deposits.filter((d: any) => {
    if (depFilter !== 'all' && d.status !== depFilter) return false;
    if (search && !(d.profiles?.full_name || '').toLowerCase().includes(search.toLowerCase()) && !d.package_name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const filteredWith = withdrawals.filter((w: any) => {
    if (withFilter !== 'all' && w.status !== withFilter) return false;
    return true;
  });

  const filterBtn = (current: StatusFilter, setFn: (v: StatusFilter) => void, counts: Record<string, number>) => (
    <div className="flex gap-1 flex-wrap">
      {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(f => (
        <button key={f} onClick={() => setFn(f)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${current === f ? 'bg-brand-600 text-snow' : 'bg-navy-800 text-silver hover:bg-navy-700'}`}>
          {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          {counts[f] > 0 && <span className="ml-1 opacity-70">({counts[f]})</span>}
        </button>
      ))}
    </div>
  );

  const actionButtons = (target: 'deposit' | 'withdrawal', item: any, size: 'sm' | 'lg' = 'sm') => {
    if (item.status !== 'pending') return null;
    const loading = actionLoading === `${target}-${item.id}`;
    const btnBase = size === 'lg'
      ? 'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition btn-press disabled:opacity-50'
      : 'flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold transition btn-press disabled:opacity-50';
    return (
      <>
        <button
          onClick={() => setConfirmAction({ type: 'approve', target, id: item.id, itemName: item.package_name || `KSh ${parseFloat(item.amount || item.total_return || 0).toLocaleString()}` })}
          disabled={loading}
          className={`${btnBase} bg-brand-600 text-snow hover:bg-brand-700`}
        >
          <CheckCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} /> Approve
        </button>
        <button
          onClick={() => { setRejectReason(''); setConfirmAction({ type: 'reject', target, id: item.id, itemName: item.package_name || `KSh ${parseFloat(item.amount || item.total_return || 0).toLocaleString()}` }); }}
          disabled={loading}
          className={`${btnBase} bg-danger-600 text-snow hover:bg-danger-500`}
        >
          <XCircle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} /> Reject
        </button>
      </>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-snow">Admin Dashboard</h1>
        <p className="text-muted mt-1 text-sm">Manage the SmartNest Farm platform</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-hide">
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); setDepFilter('all'); setWithFilter('all'); }} className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${tab === t.key ? 'bg-brand-600 text-snow shadow-md shadow-brand-600/20' : 'bg-navy-900 text-silver hover:bg-navy-800 hover:text-snow'}`}>
            <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <StatsCard title="Total Users" value={stats.totalUsers || 0} icon={Users} color="blue" />
            <StatsCard title="Total Deposits" value={fmt(stats.totalDeposits || 0)} icon={ArrowDownToLine} color="green" />
            <StatsCard title="Active Investments" value={stats.activeInvestments || 0} icon={TrendingUp} color="purple" />
            <StatsCard title="Total Earnings" value={fmt(stats.totalEarnings || 0)} icon={TrendingUp} color="teal" />
            <StatsCard title="Pending Deposits" value={stats.pendingDeposits || 0} icon={ArrowDownToLine} color="orange" />
            <StatsCard title="Total Withdrawals" value={fmt(stats.totalWithdrawals || 0)} icon={ArrowUpFromLine} color="red" />
            <StatsCard title="Pending Withdrawals" value={stats.pendingWithdrawals || 0} icon={ArrowUpFromLine} color="yellow" />
            <StatsCard title="Total Sales" value={fmt(stats.totalSales || 0)} icon={ShoppingCart} color="blue" />
          </div>
        </motion.div>
      )}

      {/* DEPOSITS */}
      {tab === 'deposits' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or package..." className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-900 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
            </div>
            {filterBtn(depFilter, setDepFilter, {
              all: deposits.length,
              pending: deposits.filter((d: any) => d.status === 'pending').length,
              approved: deposits.filter((d: any) => d.status === 'approved').length,
              rejected: deposits.filter((d: any) => d.status === 'rejected').length,
            })}
          </div>

          <div className="hidden sm:block bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">ID</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">User</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Package</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Method</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Ref</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Status</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {filteredDeps.map((d: any) => (
                    <tr key={d.id} className="hover:bg-navy-800/50 transition">
                      <td className="px-3 py-2.5 text-snow font-mono text-xs">#{d.id}</td>
                      <td className="px-3 py-2.5 text-snow">{d.profiles?.full_name || d.user_id?.slice(0,8)}</td>
                      <td className="px-3 py-2.5 text-silver">{d.package_name}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-snow">KSh {parseFloat(d.total_return || 0).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-silver text-xs">{d.pay_method || '—'}</td>
                      <td className="px-3 py-2.5 text-silver font-mono text-xs">{d.transaction_ref || '—'}</td>
                      <td className="px-3 py-2.5 text-silver text-xs whitespace-nowrap">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5">{statusBadge(d.status)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailItem(d)} className="p-1.5 text-silver hover:text-snow hover:bg-navy-700 rounded-lg transition" title="View Details"><Eye className="w-4 h-4" /></button>
                          {d.status === 'pending' && <>
                            <button onClick={() => setConfirmAction({ type: 'approve', target: 'deposit', id: d.id, itemName: d.package_name })} disabled={actionLoading === `deposit-${d.id}`} className="p-1.5 text-brand-600 hover:bg-brand-100/30 rounded-lg transition disabled:opacity-50" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setRejectReason(''); setConfirmAction({ type: 'reject', target: 'deposit', id: d.id, itemName: d.package_name }); }} disabled={actionLoading === `deposit-${d.id}`} className="p-1.5 text-danger-500 hover:bg-danger-100/20 rounded-lg transition disabled:opacity-50" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDeps.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted">No deposits found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-3">
            {filteredDeps.map((d: any) => (
              <div key={d.id} className="bg-navy-900 rounded-xl border border-navy-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted">#{d.id}</span>
                  {statusBadge(d.status)}
                </div>
                <p className="font-semibold text-snow">{d.profiles?.full_name || 'Unknown'}</p>
                <p className="text-sm text-silver">{d.package_name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-snow">KSh {parseFloat(d.total_return || 0).toLocaleString()}</span>
                  <span className="text-xs text-muted">{new Date(d.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted">
                  <span>{d.pay_method || '—'}</span>
                  <span>·</span>
                  <span className="font-mono">{d.transaction_ref || '—'}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setDetailItem(d)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-navy-800 text-silver text-xs font-medium hover:text-snow transition"><Eye className="w-3.5 h-3.5" /> Details</button>
                  {actionButtons('deposit', d)}
                </div>
              </div>
            ))}
            {filteredDeps.length === 0 && <div className="text-center py-10 text-muted">No deposits found</div>}
          </div>
        </motion.div>
      )}

      {/* WITHDRAWALS */}
      {tab === 'withdrawals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {filterBtn(withFilter, setWithFilter, {
              all: withdrawals.length,
              pending: withdrawals.filter((w: any) => w.status === 'pending').length,
              approved: withdrawals.filter((w: any) => w.status === 'approved').length,
              rejected: withdrawals.filter((w: any) => w.status === 'rejected').length,
            })}
          </div>

          <div className="hidden sm:block bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">ID</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">User</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Method</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Phone</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Status</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {filteredWith.map((w: any) => (
                    <tr key={w.id} className="hover:bg-navy-800/50 transition">
                      <td className="px-3 py-2.5 text-snow font-mono text-xs">#{w.id}</td>
                      <td className="px-3 py-2.5 text-snow">{w.profiles?.full_name || w.user_id?.slice(0,8)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-snow">KSh {parseFloat(w.amount).toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-silver">{w.method}</td>
                      <td className="px-3 py-2.5 text-silver text-xs">{w.phone || '—'}</td>
                      <td className="px-3 py-2.5 text-silver text-xs whitespace-nowrap">{new Date(w.created_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2.5">{statusBadge(w.status)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setDetailItem(w)} className="p-1.5 text-silver hover:text-snow hover:bg-navy-700 rounded-lg transition" title="View Details"><Eye className="w-4 h-4" /></button>
                          {w.status === 'pending' && <>
                            <button onClick={() => setConfirmAction({ type: 'approve', target: 'withdrawal', id: w.id, itemName: `KSh ${parseFloat(w.amount).toLocaleString()}` })} disabled={actionLoading === `withdrawal-${w.id}`} className="p-1.5 text-brand-600 hover:bg-brand-100/30 rounded-lg transition disabled:opacity-50" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                            <button onClick={() => { setRejectReason(''); setConfirmAction({ type: 'reject', target: 'withdrawal', id: w.id, itemName: `KSh ${parseFloat(w.amount).toLocaleString()}` }); }} disabled={actionLoading === `withdrawal-${w.id}`} className="p-1.5 text-danger-500 hover:bg-danger-100/20 rounded-lg transition disabled:opacity-50" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWith.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-muted">No withdrawals found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sm:hidden space-y-3">
            {filteredWith.map((w: any) => (
              <div key={w.id} className="bg-navy-900 rounded-xl border border-navy-800 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-muted">#{w.id}</span>
                  {statusBadge(w.status)}
                </div>
                <p className="font-semibold text-snow">{w.profiles?.full_name || 'Unknown'}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-snow">KSh {parseFloat(w.amount).toLocaleString()}</span>
                  <span className="text-xs text-muted">{w.method}</span>
                </div>
                <div className="text-xs text-muted mt-1">{w.phone || '—'} · {new Date(w.created_at).toLocaleDateString()}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setDetailItem(w)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-navy-800 text-silver text-xs font-medium hover:text-snow transition"><Eye className="w-3.5 h-3.5" /> Details</button>
                  {actionButtons('withdrawal', w)}
                </div>
              </div>
            ))}
            {filteredWith.length === 0 && <div className="text-center py-10 text-muted">No withdrawals found</div>}
          </div>
        </motion.div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-900 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
          </div>
          <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50"><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Name</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">ID</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Phone</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Role</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Joined</th></tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {users.filter((u: any) => !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase())).map((u: any) => (
                    <tr key={u.id} className="hover:bg-navy-800/50 transition">
                      <td className="px-3 py-2.5 font-medium text-snow">{u.full_name || '—'}</td>
                      <td className="px-3 py-2.5 text-silver text-xs font-mono">{u.user_id ? u.user_id.slice(0, 12) + '...' : '—'}</td>
                      <td className="px-3 py-2.5 text-silver">{u.phone || '—'}</td>
                      <td className="px-3 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-accent-100 text-accent-500' : 'bg-info-100 text-info-500'}`}>{u.role}</span></td>
                      <td className="px-3 py-2.5 text-silver text-xs whitespace-nowrap">{new Date(u.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {users.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No users found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* PACKAGES */}
      {tab === 'packages' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Package</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Deposit</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Monthly</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Daily</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Duration</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-muted uppercase">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {packages.map((pkg: any) => {
                    let details = { monthly: 0, daily: 0, duration: 0 };
                    try { if (pkg.description?.startsWith('{')) details = JSON.parse(pkg.description); } catch {}
                    return (
                      <tr key={pkg.id} className="hover:bg-navy-800/50 transition">
                        <td className="px-3 py-2.5 font-medium text-snow">{pkg.name}</td>
                        <td className="px-3 py-2.5 text-right text-snow">KSh {parseFloat(pkg.price).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-brand-500">KSh {details.monthly.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-brand-400">KSh {details.daily.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-silver">{details.duration} days</td>
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => updatePackage(pkg.id, { active: !pkg.active })} className={`px-3 py-1 rounded-full text-xs font-semibold transition ${pkg.active ? 'bg-brand-100 text-brand-500' : 'bg-danger-100 text-danger-500'}`}>{pkg.active ? 'Active' : 'Inactive'}</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* SALES */}
      {tab === 'sales' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50"><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Date</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">User</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Buyer</th><th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Qty</th><th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Total</th></tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {salesData.map((s: any) => (
                    <tr key={s.id} className="hover:bg-navy-800/50 transition">
                      <td className="px-3 py-2.5 text-snow whitespace-nowrap">{s.date}</td>
                      <td className="px-3 py-2.5 text-silver">{s.profiles?.full_name || '—'}</td>
                      <td className="px-3 py-2.5 text-silver">{s.buyer}</td>
                      <td className="px-3 py-2.5 text-right text-silver">{s.quantity}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-brand-500">KSh {parseFloat(s.total).toLocaleString()}</td>
                    </tr>
                  ))}
                  {salesData.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted">No sales records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* FEEDING */}
      {tab === 'feeding' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50"><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Date</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">User</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Flock</th><th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Feed</th><th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Qty</th><th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Cost</th></tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {feedingData.map((f: any) => (
                    <tr key={f.id} className="hover:bg-navy-800/50 transition">
                      <td className="px-3 py-2.5 text-snow whitespace-nowrap">{f.date}</td>
                      <td className="px-3 py-2.5 text-silver">{f.profiles?.full_name || '—'}</td>
                      <td className="px-3 py-2.5 text-silver">{f.flocks?.name || '—'}</td>
                      <td className="px-3 py-2.5 text-silver">{f.feed_type}</td>
                      <td className="px-3 py-2.5 text-right text-silver">{f.quantity_kg} kg</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-snow">KSh {parseFloat(f.cost).toLocaleString()}</td>
                    </tr>
                  ))}
                  {feedingData.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No feeding records</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* REFERRALS */}
      {tab === 'referrals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="max-w-2xl">
            <div className="bg-navy-900 rounded-xl border border-navy-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 rounded-lg bg-brand-100"><Settings className="w-5 h-5 text-brand-500" /></div>
                <div><h2 className="text-lg font-bold text-snow">Referral Benefit Levels</h2><p className="text-sm text-muted">Weekly benefits are based on direct referred members.</p></div>
              </div>
              <table className="w-full text-sm">
                <thead><tr className="border-b border-navy-800 text-left text-xs uppercase text-muted">
                  <th className="py-3">Level</th><th className="py-3">Direct members</th><th className="py-3 text-right">Weekly payment</th>
                </tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {refConfig.levels.map((level: any) => <tr key={level.level} className="text-silver">
                    <td className="py-3">Level {level.level}</td><td className="py-3">{level.members} members</td><td className="py-3 text-right">KSh {level.weekly_payment.toLocaleString()}</td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* CLAIMS */}
      {tab === 'claims' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-navy-800/50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">User</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Package</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Activated</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Status</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase">Claimed</th>
                </tr></thead>
                <tbody className="divide-y divide-navy-800">
                  {claimsData.map((c: any) => {
                    const activatedAt = c.activated_at ? new Date(c.activated_at) : null;
                    const claimableAt = activatedAt ? new Date(activatedAt.getTime() + 24 * 60 * 60 * 1000) : null;
                    const now = new Date();
                    const isClaimable = c.status === 'locked' && claimableAt && now >= claimableAt;
                    const remainingMs = claimableAt ? Math.max(0, claimableAt.getTime() - now.getTime()) : 0;
                    const remH = Math.floor(remainingMs / 3600000);
                    const remM = Math.floor((remainingMs % 3600000) / 60000);
                    return (
                      <tr key={c.id} className="hover:bg-navy-800/50 transition">
                        <td className="px-3 py-2.5 text-snow">{c.profiles?.full_name || c.user_id?.slice(0,8)}</td>
                        <td className="px-3 py-2.5 text-silver">{c.package_name}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-snow">KSh {parseFloat(c.amount).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-silver text-xs whitespace-nowrap">{activatedAt ? activatedAt.toLocaleDateString() : '—'}</td>
                        <td className="px-3 py-2.5">
                          {c.status === 'claimed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-500"><CheckCircle className="w-3 h-3" /> Claimed</span>
                          ) : isClaimable ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-info-100 text-info-500"><Gift className="w-3 h-3" /> Claimable</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-warn-100 text-warn-500"><Timer className="w-3 h-3" /> {remH}h {remM}m</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-silver text-xs whitespace-nowrap">{c.claimed_at ? new Date(c.claimed_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    );
                  })}
                  {claimsData.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No claims found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDetailItem(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-navy-900 rounded-2xl border border-navy-800 p-6 max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-snow">Transaction Details</h3>
                <button onClick={() => setDetailItem(null)} className="p-2 rounded-lg text-muted hover:text-snow hover:bg-navy-800 transition"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-3">
                {Object.entries(detailItem).map(([key, val]) => {
                  if (key === 'profiles' || key === 'flocks') return null;
                  const displayVal = val === null || val === undefined ? '—' : typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/) ? new Date(val).toLocaleString() : String(val);
                  if (displayVal.length > 80) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0">
                      <span className="text-sm text-muted capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-medium text-snow text-right max-w-[60%] truncate">{displayVal}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { setConfirmAction(null); setActionError(''); }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-navy-900 rounded-2xl border border-navy-800 p-6 max-w-md w-full" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${confirmAction.type === 'approve' ? 'bg-brand-100' : 'bg-danger-100'}`}>
                  {confirmAction.type === 'approve'
                    ? <CheckCircle className="w-5 h-5 text-brand-500" />
                    : <AlertTriangle className="w-5 h-5 text-danger-500" />
                  }
                </div>
                <div>
                  <h3 className="text-lg font-bold text-snow">
                    {confirmAction.type === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </h3>
                  <p className="text-sm text-muted">
                    {confirmAction.target === 'deposit' ? 'Deposit' : 'Withdrawal'}: {confirmAction.itemName}
                  </p>
                </div>
              </div>

              {confirmAction.type === 'approve' ? (
                <p className="text-sm text-silver mb-4">
                  Are you sure you want to approve this {confirmAction.target}? This will{' '}
                  {confirmAction.target === 'deposit'
                    ? 'create an active investment and 24-hour claim lock'
                    : 'mark the withdrawal as processed'
                  }. This action cannot be undone.
                </p>
              ) : (
                <div className="mb-4">
                  <p className="text-sm text-silver mb-3">
                    Provide a reason for rejecting this {confirmAction.target} (optional):
                  </p>
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="e.g. Invalid transaction reference, insufficient proof..."
                    className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600 min-h-[80px] resize-none"
                  />
                </div>
              )}

              {actionError && (
                <div className="mb-4 p-3 rounded-lg bg-danger-100/30 border border-danger-600/30 text-danger-500 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> {actionError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => executeAction(confirmAction, rejectReason)}
                  disabled={actionLoading !== null}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition btn-press disabled:opacity-50 ${
                    confirmAction.type === 'approve'
                    ? 'bg-brand-600 text-snow hover:bg-brand-700' : 'bg-danger-600 text-snow hover:bg-danger-500'
                  }`}
                >
                  {actionLoading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : (
                    <>
                      {confirmAction.type === 'approve' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {confirmAction.type === 'approve' ? 'Approve' : 'Reject'}
                    </>
                  )}
                </button>
                <button
                  onClick={() => { setConfirmAction(null); setActionError(''); setRejectReason(''); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-navy-700 text-silver text-sm font-medium hover:text-snow hover:bg-navy-800 transition"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
