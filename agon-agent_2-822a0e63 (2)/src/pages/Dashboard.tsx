import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { TrendingUp, Clock, Wallet, ArrowDownToLine, ArrowUpFromLine, CircleDollarSign, ArrowRight, Gift, CheckCircle2, Lock, Timer, MessageCircle, Phone, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [investments, setInvestments] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimError, setClaimError] = useState('');
  const [now, setNow] = useState(new Date());

  // Tick every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const [invRes, depRes, txRes, claimsRes] = await Promise.all([
        fetch(`/api/investments?user_id=${user.id}`),
        fetch(`/api/deposits?user_id=${user.id}`),
        fetch(`/api/transactions?user_id=${user.id}`),
        fetch(`/api/claims?user_id=${user.id}`),
      ]);
      setInvestments(await invRes.json());
      setDeposits(await depRes.json());
      setTransactions((await txRes.json()).slice(0, 5));
      setClaims(await claimsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleClaim = async (investmentId: number) => {
    if (!user) return;
    setClaimingId(investmentId);
    setClaimError('');
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investment_id: investmentId, user_id: user.id }),
      });
      if (!res.ok) {
        const errData = await res.json();
        setClaimError(errData.error || 'Claim failed');
        setTimeout(() => setClaimError(''), 5000);
      } else {
        loadData();
      }
    } catch (err: any) {
      setClaimError(err.message || 'Claim failed');
    } finally {
      setClaimingId(null);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const active = investments.filter(i => i.status === 'active' || i.status === 'claimed');
  const pending = deposits.filter(d => d.status === 'pending');
  const totalDeposits = deposits.filter(d => d.status === 'approved').reduce((s, d) => s + parseFloat(d.total_return), 0);
  const totalEarnings = claims.filter(c => c.status === 'claimed').reduce((s, c) => s + parseFloat(c.amount), 0);
  const withdrawable = claims.filter(c => c.status === 'claimed').reduce((s, c) => s + parseFloat(c.amount) * 0.6, 0);
  const fmt = (n: number) => 'KSh ' + Math.round(n).toLocaleString();

  const getClaimForInvestment = (invId: number) => claims.find(c => c.investment_id === invId);

  const getCountdown = (claim: any) => {
    if (!claim || !claim.activated_at) return null;
    const activatedAt = new Date(claim.activated_at);
    const claimableAt = new Date(activatedAt.getTime() + 24 * 60 * 60 * 1000);
    const remaining = claimableAt.getTime() - now.getTime();
    if (remaining <= 0) return null;
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remaining % (60 * 1000)) / 1000);
    return { hours, minutes, seconds, claimableAt };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-snow">Dashboard</h1>
        <p className="text-muted mt-1">Welcome back! Here's your investment overview.</p>
      </div>

      {claimError && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg bg-danger-100/30 border border-danger-600/30 text-danger-500 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4" /> {claimError}
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatsCard title="Active" value={active.length} icon={TrendingUp} color="green" subtitle="investments" />
        <StatsCard title="Pending" value={pending.length} icon={Clock} color="orange" subtitle="deposits" />
        <StatsCard title="Deposits" value={fmt(totalDeposits)} icon={ArrowDownToLine} color="blue" />
        <StatsCard title="Earnings" value={fmt(totalEarnings)} icon={CircleDollarSign} color="purple" />
        <StatsCard title="Withdrawable" value={fmt(withdrawable)} icon={Wallet} color="teal" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-snow">Recent Transactions</h2>
            <Link to="/transactions" className="text-sm text-brand-500 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted py-4 text-center">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-navy-800 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-snow truncate">{tx.description}</p>
                    <p className="text-xs text-muted">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className={`text-sm font-bold ${['deposit', 'sale', 'claim', 'referral_bonus', 'referral_weekly'].includes(tx.type) ? 'text-brand-500' : 'text-red-500'}`}>KSh {parseFloat(tx.amount).toLocaleString()}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${tx.status === 'completed' ? 'bg-brand-100 text-brand-500' : tx.status === 'pending' ? 'bg-warn-100 text-warn-500' : 'bg-danger-100 text-danger-500'}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Investment Performance with Claims */}
        <div className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <h2 className="font-bold text-snow mb-4">Investment Performance</h2>
          {active.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted mb-4">No active investments yet</p>
              <Link to="/deposit" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-snow text-sm font-medium hover:bg-brand-700 transition">
                <ArrowDownToLine className="w-4 h-4" /> Make a Deposit
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {active.map((inv: any) => {
                const claim = getClaimForInvestment(inv.id);
                const countdown = claim ? getCountdown(claim) : null;
                const isClaimed = claim?.status === 'claimed';
                const isClaimable = claim?.status === 'locked' && countdown === null;
                const isLocked = claim?.status === 'locked' && countdown !== null;
                const progress = Math.min(100, ((parseFloat(inv.returns) - parseFloat(inv.amount)) / parseFloat(inv.amount)) * 100);

                return (
                  <div key={inv.id} className="p-4 rounded-lg bg-navy-900 border border-navy-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-snow">{inv.package_name}</span>
                      {isClaimed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Claimed
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-warn-500">
                          <Timer className="w-3.5 h-3.5" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-500">
                          <Gift className="w-3.5 h-3.5" /> Claimable
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-navy-800 rounded-full h-2 mb-2">
                      <div className="bg-brand-600 h-2 rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted mb-3">
                      <span>Invested: KSh {parseFloat(inv.amount).toLocaleString()}</span>
                      <span>Returns: KSh {parseFloat(inv.returns).toLocaleString()}</span>
                    </div>

                    {/* Claim Section */}
                    {claim && !isClaimed && (
                      <div className="pt-3 border-t border-navy-800">
                        {isLocked && countdown && (
                          <div className="mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-warn-500 font-medium mb-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              <span>Claim available in</span>
                            </div>
                            <div className="flex gap-2">
                              {[
                                { value: countdown.hours, label: 'hrs' },
                                { value: countdown.minutes, label: 'min' },
                                { value: countdown.seconds, label: 'sec' },
                              ].map((unit, i) => (
                                <div key={i} className="flex-1 text-center bg-warn-100 rounded-lg py-1.5 border border-amber-200 dark:border-warn-600/30">
                                  <span className="text-lg font-bold text-warn-500 tabular-nums">{String(unit.value).padStart(2, '0')}</span>
                                  <span className="text-[10px] text-warn-500 block -mt-0.5">{unit.label}</span>
                                </div>
                              ))}
                            </div>
                            <button disabled className="w-full mt-2 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-navy-800 text-muted text-sm font-medium cursor-not-allowed">
                              <Lock className="w-4 h-4" /> Claim Locked
                            </button>
                          </div>
                        )}
                        {isClaimable && (
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-brand-500 font-medium mb-2">
                              <Gift className="w-3.5 h-3.5" />
                              <span>Your package is now claimable!</span>
                            </div>
                            <button
                              onClick={() => handleClaim(inv.id)}
                              disabled={claimingId === inv.id}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-snow text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition shadow-md"
                            >
                              {claimingId === inv.id ? (
                                <>Processing...</>
                              ) : (
                                <><Gift className="w-4 h-4" /> Claim Returns</>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {isClaimed && claim?.claimed_at && (
                      <div className="pt-3 border-t border-navy-800">
                        <div className="flex items-center gap-1.5 text-xs text-brand-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Claimed on {new Date(claim.claimed_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Community & Info Section */}
      <div className="mt-6 grid sm:grid-cols-2 gap-4">
        <div className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <h2 className="font-bold text-snow mb-3 flex items-center gap-2"><MessageCircle className="w-5 h-5 text-brand-500" /> Community & Support</h2>
          <p className="text-sm text-muted mb-4">Connect with other investors and reach our admin team.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#25D366] text-snow text-sm font-semibold hover:bg-[#20BD5A] transition btn-press"
            >
              <MessageCircle className="w-4 h-4" /> Join WhatsApp Group
            </a>
            <a
              href="https://wa.me/254711232538"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-navy-700 text-silver text-sm font-medium hover:text-snow hover:border-navy-600 transition"
            >
              <Phone className="w-4 h-4" /> Contact Admin
            </a>
          </div>
        </div>

        <div className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <h2 className="font-bold text-snow mb-3 flex items-center gap-2"><Info className="w-5 h-5 text-info-500" /> Withdrawal Info</h2>
          <ul className="space-y-2 text-sm text-silver">
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" /> Minimum Withdrawal: <span className="font-bold text-snow">KSh 200</span></li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" /> Processing time: 24–48 hours</li>
            <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" /> All withdrawals require admin approval</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
