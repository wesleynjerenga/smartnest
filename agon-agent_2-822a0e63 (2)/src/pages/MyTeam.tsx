import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Link, Copy, CheckCircle, Users, TrendingUp, CircleDollarSign, ChevronRight, ArrowLeft, Layers, Award } from 'lucide-react';

export default function MyTeam() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'l1' | 'l2'>('l1');

  const fetchData = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/referrals?user_id=${user.id}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Referral fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const handleCopy = async () => {
    if (!data?.referral_link) return;
    try {
      await navigator.clipboard.writeText(data.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = data.referral_link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const fmt = (n: number) => 'KSh ' + Math.round(n).toLocaleString();
  const stats = data?.stats || { level1_count: 0, level2_count: 0, total_earnings: 0, team_investment: 0 };
  const benefit = data?.referral_benefit || { level: 0, member_count: stats.level1_count, weekly_payment: 0, next_level: 1, members_to_next_level: 8 };
  const l1Members = data?.level1_members || [];
  const l2Members = data?.level2_members || [];
  const levels = data?.config?.levels || [
    { level: 1, members: 8, weekly_payment: 300 },
    { level: 2, members: 15, weekly_payment: 800 },
    { level: 3, members: 24, weekly_payment: 1500 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link to="/dashboard" className="p-2 rounded-lg hover:bg-navy-800 text-muted transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-snow">My Team</h1>
          <p className="text-muted text-sm mt-0.5">Grow your network and earn referral rewards</p>
        </div>
      </div>

      {/* Referral Link Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-600 p-6 sm:p-8 mb-8 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-snow/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-snow/5 rounded-full translate-y-8 -translate-x-8" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Link className="w-5 h-5 text-brand-100" />
            <h2 className="text-lg font-bold text-snow">Your Referral Link</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1 bg-snow/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-snow/20">
              <p className="text-snow font-mono text-sm sm:text-base break-all select-all">{data?.referral_link || 'https://chickensmartfarm.com/ref=...'}</p>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all shrink-0 ${
                copied
                  ? 'bg-snow text-brand-600 shadow-lg'
                  : 'bg-snow/10 text-snow hover:bg-snow/20 border border-snow/20'
              }`}
            >
              {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
          <p className="text-brand-100 text-xs mt-3">Weekly referral benefits are based on your number of directly referred members.</p>
        </div>
      </motion.div>

      {/* Referral Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-info-100"><Users className="w-4 h-4 text-info-500" /></div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Level 1</span>
          </div>
          <p className="text-2xl font-bold text-snow">{stats.level1_count}</p>
          <p className="text-xs text-muted mt-0.5">Direct referrals</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-accent-100"><Layers className="w-4 h-4 text-accent-500" /></div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Level 2</span>
          </div>
          <p className="text-2xl font-bold text-snow">{stats.level2_count}</p>
          <p className="text-xs text-muted mt-0.5">Indirect referrals</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-brand-100"><CircleDollarSign className="w-4 h-4 text-brand-500" /></div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Weekly benefit</span>
          </div>
          <p className="text-2xl font-bold text-snow">{fmt(benefit.weekly_payment)}</p>
          <p className="text-xs text-muted mt-0.5">Level {benefit.level || 0} qualification</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-warn-100"><TrendingUp className="w-4 h-4 text-warn-500" /></div>
            <span className="text-xs font-medium text-muted uppercase tracking-wider">Team Invest</span>
          </div>
          <p className="text-2xl font-bold text-snow">{fmt(stats.team_investment)}</p>
          <p className="text-xs text-muted mt-0.5">Team investment total</p>
        </motion.div>
      </div>

      {/* Referral Levels */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5 sm:p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Award className="w-5 h-5 text-brand-500" />
          <h2 className="text-lg font-bold text-snow">Weekly Referral Benefits</h2>
        </div>
        <p className="text-sm text-silver mb-4">
          {benefit.level
            ? `You qualify for Level ${benefit.level}: ${fmt(benefit.weekly_payment)} per week.`
            : `You need ${benefit.members_to_next_level} more direct members to qualify for your first weekly benefit.`}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-navy-800 text-left text-xs uppercase text-muted">
              <th className="px-3 py-2">Level</th><th className="px-3 py-2">Direct members</th><th className="px-3 py-2 text-right">Weekly payment</th>
            </tr></thead>
            <tbody className="divide-y divide-navy-800">
              {levels.map((level: any) => (
                <tr key={level.level} className={benefit.level === level.level ? 'text-brand-500' : 'text-silver'}>
                  <td className="px-3 py-2.5">Level {level.level}</td>
                  <td className="px-3 py-2.5">{level.members} members</td>
                  <td className="px-3 py-2.5 text-right">{fmt(level.weekly_payment)} per week</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Team Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('l1')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'l1'
              ? 'bg-brand-600 text-snow shadow-md'
              : 'bg-navy-900 text-silver hover:bg-navy-800'
          }`}
        >
          <Users className="w-4 h-4" /> Level 1 Team
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'l1' ? 'bg-snow/20 text-snow' : 'bg-navy-800 text-muted'}`}>{stats.level1_count}</span>
        </button>
        <button
          onClick={() => setActiveTab('l2')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === 'l2'
              ? 'bg-brand-600 text-snow shadow-md'
              : 'bg-navy-900 text-silver hover:bg-navy-800'
          }`}
        >
          <Layers className="w-4 h-4" /> Level 2 Team
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === 'l2' ? 'bg-snow/20 text-snow' : 'bg-navy-800 text-muted'}`}>{stats.level2_count}</span>
        </button>
      </div>

      {/* Team Table */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden"
      >
        {activeTab === 'l1' && (
          l1Members.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted font-medium">No members yet.</p>
              <p className="text-muted text-sm mt-1">Share your referral link to start building your team!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Package</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Investment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {l1Members.map((m: any) => (
                    <tr key={m.user_id} className="hover:bg-navy-800 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-500 font-bold text-xs">
                            {(m.full_name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-snow">{m.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-500">
                          <CheckCircle className="w-3 h-3" /> {m.registration_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          m.package_status === 'Invested'
                            ? 'bg-info-100 text-info-500'
                            : 'bg-navy-800 text-muted'
                        }`}>{m.package_status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-snow">{fmt(m.investment_amount)}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(m.joined).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'l2' && (
          l2Members.length === 0 ? (
            <div className="py-16 text-center">
              <Layers className="w-12 h-12 text-muted mx-auto mb-3" />
              <p className="text-muted font-medium">No members yet.</p>
              <p className="text-muted text-sm mt-1">Level 2 members appear when your Level 1 team refers others.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy-900">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Member</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Package</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted uppercase">Investment</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {l2Members.map((m: any) => (
                    <tr key={m.user_id} className="hover:bg-navy-800 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent-100 flex items-center justify-center text-accent-500 font-bold text-xs">
                            {(m.full_name || 'M').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-snow">{m.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-500">
                          <CheckCircle className="w-3 h-3" /> {m.registration_status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          m.package_status === 'Invested'
                            ? 'bg-info-100 text-info-500'
                            : 'bg-navy-800 text-muted'
                        }`}>{m.package_status}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-snow">{fmt(m.investment_amount)}</td>
                      <td className="px-4 py-3 text-muted whitespace-nowrap">{new Date(m.joined).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </motion.div>
    </div>
  );
}