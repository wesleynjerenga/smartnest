import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PackageCard from '../components/PackageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { ArrowDownToLine, CheckCircle, AlertCircle, Info, TrendingUp, Coins, Calendar, MessageCircle, Phone } from 'lucide-react';

function parsePkgDetails(pkg: any) {
  try {
    if (typeof pkg.description === 'string' && pkg.description.startsWith('{')) {
      return JSON.parse(pkg.description);
    }
  } catch {}
  return { monthly: 0, daily: 0, duration: 0 };
}

export default function Deposit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [chickenType, setChickenType] = useState('Broiler');
  const [avgWeight, setAvgWeight] = useState('1.5');
  const [numBirds, setNumBirds] = useState('10');
  const [payMethod, setPayMethod] = useState('M-Pesa');
  const [txRef, setTxRef] = useState('');
  const [phoneUsed, setPhoneUsed] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/packages?active=true').then(r => r.json()).then(d => { setPackages(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSelectPkg = (pkg: any) => {
    setSelectedPkg(pkg);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const pkgDetails = selectedPkg ? parsePkgDetails(selectedPkg) : null;
  const depositAmt = selectedPkg ? parseFloat(selectedPkg.price) : 0;
  const monthlyReturn = pkgDetails?.monthly || 0;
  const dailyReturn = pkgDetails?.daily || 0;
  const duration = pkgDetails?.duration || 0;
  const fmt = (n: number) => 'KSh ' + Math.round(n).toLocaleString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPkg) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id, package_id: selectedPkg.id, package_name: selectedPkg.name,
          chicken_type: chickenType, avg_weight: avgWeight, num_birds: numBirds,
          pay_method: payMethod, transaction_ref: txRef, phone_used: phoneUsed,
          deposit_amount: depositAmt, monthly_return: monthlyReturn,
          daily_return: dailyReturn, duration_days: duration,
        }),
      });
      if (!res.ok) throw new Error('Deposit failed');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit deposit');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="inline-flex p-4 rounded-full bg-brand-100 mb-6">
          <CheckCircle className="w-12 h-12 text-brand-600" />
        </motion.div>
        <h2 className="text-2xl font-bold text-snow mb-2">Deposit Submitted!</h2>
        <p className="text-muted mb-6">Your deposit is pending admin approval. You'll be notified once it's approved.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 transition">Go to Dashboard</button>
          <button onClick={() => { setSuccess(false); setSelectedPkg(null); }} className="px-6 py-2.5 rounded-lg border border-navy-800 text-silver font-medium hover:bg-navy-800 transition">New Deposit</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-snow mb-2">Make a Deposit</h1>
        <p className="text-muted mb-8">Select a package and enter your investment details</p>
      </motion.div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Package Selection */}
        <div className="lg:col-span-2">
          <div className="bg-navy-900 rounded-xl border border-navy-800 p-5">
            <h2 className="font-bold text-snow mb-4">Chicken Investment Packages</h2>
            <div className="space-y-2">
              {packages.map((pkg: any, i: number) => (
                <PackageCard key={pkg.id} pkg={pkg} compact index={i} onSelect={handleSelectPkg} selected={selectedPkg?.id === pkg.id} />
              ))}
            </div>
          </div>
        </div>

        {/* Deposit Form */}
        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-navy-900 rounded-xl border border-navy-800 p-5 space-y-5">
            <h2 className="font-bold text-snow">Investment Details</h2>

            {/* Selected Package Summary */}
            {selectedPkg && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-4 rounded-xl bg-navy-900 border border-navy-800 space-y-3">
                <h3 className="font-bold text-snow flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-brand-600" /> {selectedPkg.name}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-muted uppercase">Deposit</p>
                    <p className="text-sm font-bold text-snow">{fmt(depositAmt)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted uppercase">Monthly</p>
                    <p className="text-sm font-bold text-brand-500">{fmt(monthlyReturn)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted uppercase">Daily</p>
                    <p className="text-sm font-bold text-brand-400">{fmt(dailyReturn)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-muted uppercase">Duration</p>
                    <p className="text-sm font-bold text-snow">{duration} Days</p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-silver mb-1">Chicken Type</label>
                <select value={chickenType} onChange={e => setChickenType(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600">
                  <option>Broiler</option><option>Layers</option><option>Kienyeji</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-1">Avg Weight per Bird (kg)</label>
                <input type="number" step="0.1" min="0.1" value={avgWeight} onChange={e => setAvgWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-silver mb-1">Number of Birds</label>
                <input type="number" min="1" value={numBirds} onChange={e => setNumBirds(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
              </div>
            </div>

            {/* Total Return Card */}
            <div className="p-4 rounded-lg bg-brand-100 border border-brand-600/30">
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-500 dark:text-brand-200">Total Return:</span>
                <span className="text-2xl font-bold text-brand-500">{fmt(monthlyReturn)}</span>
              </div>
              <div className="flex items-start gap-2 mt-2 text-xs text-brand-500">
                <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Final amount is calculated and confirmed by the server when you submit.</span>
              </div>
            </div>

            <div className="border-t border-navy-800 pt-5">
              <h3 className="font-bold text-snow mb-4">Payment Details</h3>
              <div className="p-3 rounded-lg bg-navy-900 mb-4 text-sm space-y-1">
                <p><span className="text-muted">Pay To:</span> <span className="font-medium text-snow">Monica Kamau</span></p>
                <p><span className="text-muted">Number:</span> <span className="font-medium text-snow">+254755942760</span></p>
              </div>
              <div className="p-3 rounded-lg bg-brand-100/30 border border-brand-600/20 mb-4">
                <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mb-2">Need Help?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <a href="https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-snow text-xs font-medium hover:bg-[#20BD5A] transition btn-press">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Group
                  </a>
                  <a href="https://wa.me/254711232538" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-navy-700 text-silver text-xs font-medium hover:text-snow transition">
                    <Phone className="w-3.5 h-3.5" /> Contact Admin
                  </a>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-silver mb-1">Payment Method</label>
                  <select value={payMethod} onChange={e => setPayMethod(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600">
                    <option>M-Pesa</option><option>Airtel Money</option><option>Bank</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-silver mb-1">Transaction Reference</label>
                  <input type="text" value={txRef} onChange={e => setTxRef(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" placeholder="e.g. SHFK4X7ZR" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-silver mb-1">Phone Number Used for Deposit</label>
                  <input type="tel" value={phoneUsed} onChange={e => setPhoneUsed(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" placeholder="+2547XXXXXXXX" />
                </div>
              </div>
            </div>

            {error && <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-100/30 text-danger-500 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>}

            <button type="submit" disabled={submitting || !selectedPkg} className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-danger-600 text-snow font-bold text-lg hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg">
              <ArrowDownToLine className="w-5 h-5" /> {submitting ? 'Processing...' : 'Record Deposit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}