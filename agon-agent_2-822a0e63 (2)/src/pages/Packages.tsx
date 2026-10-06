import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PackageCard from '../components/PackageCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Bird } from 'lucide-react';

export default function Packages() {
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/packages?active=true').then(r => r.json()).then(d => { setPackages(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100 text-brand-500 text-sm font-medium mb-4">
          <Bird className="w-4 h-4" /> Investment Opportunities
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-snow">Chicken Investment Packages</h1>
        <p className="mt-3 text-muted max-w-2xl mx-auto">Choose a package that fits your investment goals. Each package offers guaranteed returns with professional flock management.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {packages.map((pkg: any, i: number) => (
          <PackageCard key={pkg.id} pkg={pkg} index={i} onSelect={() => {}} />
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link to="/deposit" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 text-snow font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-600/20">
          Start Investing Now
        </Link>
      </div>
    </div>
  );
}