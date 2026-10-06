import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  subtitle?: string;
}

const colorMap: Record<string, { icon: string; bg: string; border: string }> = {
  green:  { icon: 'text-brand-500', bg: 'bg-brand-100', border: 'border-brand-600/20' },
  blue:   { icon: 'text-info-500', bg: 'bg-info-100', border: 'border-info-600/20' },
  purple: { icon: 'text-accent-500', bg: 'bg-accent-100', border: 'border-accent-600/20' },
  orange: { icon: 'text-warn-500', bg: 'bg-warn-100', border: 'border-warn-600/20' },
  red:    { icon: 'text-danger-500', bg: 'bg-danger-100', border: 'border-danger-600/20' },
  yellow: { icon: 'text-warn-500', bg: 'bg-warn-100', border: 'border-warn-600/20' },
  teal:   { icon: 'text-brand-500', bg: 'bg-brand-100', border: 'border-brand-600/20' },
};

export default function StatsCard({ title, value, icon: Icon, color = 'green', subtitle }: StatsCardProps) {
  const c = colorMap[color] || colorMap.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`bg-navy-900 rounded-xl border border-navy-800 p-5 hover:${c.border} transition-all duration-300 group`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wider">{title}</p>
          <p className="mt-2 text-2xl font-bold text-snow truncate">{value}</p>
          {subtitle && <p className="mt-1.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${c.bg} transition-transform duration-300 group-hover:scale-110`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
      </div>
    </motion.div>
  );
}