import { motion } from 'framer-motion';
import { Package, Calendar, TrendingUp, Coins, Sparkles } from 'lucide-react';

interface PackageCardProps {
  pkg: any;
  onSelect?: (pkg: any) => void;
  selected?: boolean;
  compact?: boolean;
  index?: number;
}

function parsePkgDetails(pkg: any) {
  try {
    if (typeof pkg.description === 'string' && pkg.description.startsWith('{')) {
      return JSON.parse(pkg.description);
    }
  } catch {}
  return { monthly: 0, daily: 0, duration: 0 };
}

const POPULAR_INDEXES = [4]; // Farm Pro (index 4)

export default function PackageCard({ pkg, onSelect, selected = false, compact = false, index = 0 }: PackageCardProps) {
  const details = parsePkgDetails(pkg);
  const deposit = parseFloat(pkg.price);
  const monthly = details.monthly || 0;
  const daily = details.daily || 0;
  const duration = details.duration || 0;
  const referralBonus = details.referralBonus || pkg.referral_bonus || 0;
  const maxPurchases = details.maxPurchases || pkg.max_purchases;
  const fmt = (n: number) => 'KSh ' + n.toLocaleString();
  const isPopular = POPULAR_INDEXES.includes(index);

  if (compact) {
    return (
      <button
        onClick={() => onSelect?.(pkg)}
        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 ${selected ? 'border-brand-600 bg-brand-100/50 ring-2 ring-brand-600/30' : 'border-navy-800 hover:border-brand-600/40 bg-navy-900 hover:bg-navy-900/80'}`}
      >
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-snow">{pkg.name}</span>
          <span className="text-sm font-bold text-brand-500">{fmt(deposit)}</span>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3 text-brand-500" />{fmt(monthly)}/mo</span>
          <span>·</span>
          <span>{duration} days</span>
        </div>
        <div className="mt-2 text-xs text-muted">Referral bonus {fmt(referralBonus)} · Limit {maxPurchases} {maxPurchases === 1 ? 'purchase' : 'purchases'}</div>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => onSelect?.(pkg)}
      className={`relative bg-navy-900 rounded-2xl border-2 p-5 sm:p-6 cursor-pointer transition-all duration-300 ${selected ? 'border-brand-600 shadow-xl shadow-brand-600/15' : 'border-navy-800 hover:border-brand-600/40 hover:shadow-lg hover:shadow-brand-600/5'}`}
    >
      {isPopular && (
        <div className="absolute -top-3 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-brand-600 text-snow text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-brand-600/30">
          <Sparkles className="w-3 h-3" /> Popular
        </div>
      )}

      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center">
          <Package className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <h3 className="font-bold text-snow text-[15px]">{pkg.name}</h3>
          <p className="text-xs text-muted flex items-center gap-1"><Calendar className="w-3 h-3" />{duration} Days Duration</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-1">Deposit</p>
        <p className="text-2xl sm:text-3xl font-bold text-snow tracking-tight">{fmt(deposit)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <div className="p-3 rounded-xl bg-brand-100/60 border border-brand-600/10">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
            <p className="text-[10px] font-semibold text-brand-500 uppercase tracking-wider">Monthly</p>
          </div>
          <p className="text-base sm:text-lg font-bold text-brand-500">{fmt(monthly)}</p>
        </div>
        <div className="p-3 rounded-xl bg-brand-100/30 border border-brand-600/5">
          <div className="flex items-center gap-1 mb-1">
            <Coins className="w-3.5 h-3.5 text-brand-400" />
            <p className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider">Daily</p>
          </div>
          <p className="text-base sm:text-lg font-bold text-brand-400">{fmt(daily)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Referral bonus</span>
        <span className="font-semibold text-brand-500">{fmt(referralBonus)}</span>
      </div>
      <p className="text-xs text-muted mt-1">Purchase limit: {maxPurchases} {maxPurchases === 1 ? 'time' : 'times'}</p>

      <div className="flex items-center justify-between text-xs pt-4 border-t border-navy-800">
        <span className="flex items-center gap-1.5 text-muted"><Calendar className="w-3.5 h-3.5" />{duration} Days</span>
        <span className="text-brand-500 font-semibold group-hover:translate-x-0.5 transition-transform">Select →</span>
      </div>
    </motion.div>
  );
}