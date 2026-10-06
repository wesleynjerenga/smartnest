import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bird, TrendingUp, Shield, Users, ChevronDown, ChevronUp, ArrowRight, Sprout, BarChart3, Wallet, MessageCircle, Phone } from 'lucide-react';

const WHATSAPP_GROUP = 'https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1';
const WHATSAPP_ADMIN = 'https://wa.me/254711232538';

const FAQS = [
  { q: 'What is SmartNest Farm?', a: 'SmartNest Farm is a premium poultry investment platform that allows you to invest in well-managed chicken flocks and earn returns from poultry farming without the hassle of day-to-day management.' },
  { q: 'How do I start investing?', a: 'Simply create an account, choose an investment package that fits your budget, make a deposit via M-Pesa, Airtel Money, or Bank transfer, and your investment begins once approved by our team.' },
  { q: 'How are returns calculated?', a: 'Returns are calculated based on your selected package, chicken type, average weight per bird, and the number of birds. Our server confirms the final amount upon deposit submission.' },
  { q: 'When can I withdraw my earnings?', a: 'You can request a withdrawal once your investment has matured. The minimum withdrawal amount is KSh 200. Withdrawals are processed within 24-48 hours after admin approval.' },
  { q: 'What is the minimum withdrawal amount?', a: 'The minimum withdrawal amount is KSh 200. Any withdrawal request below this amount will not be accepted.' },
  { q: 'Is my investment secure?', a: 'Yes! We use bank-grade security with Supabase authentication, row-level security, and encrypted data storage. All transactions are tracked and verified by our admin team.' },
  { q: 'What chicken types are available?', a: 'We offer three types: Broilers (fast growth), Layers (egg production), and Kienyeji (indigenous, premium market price). Each type has different return rates.' },
  { q: 'How can I contact support?', a: 'You can reach our admin team directly on WhatsApp or join our community WhatsApp group for updates, tips, and support from fellow investors.' },
];

export default function Home() {
  const [stats, setStats] = useState({ users: 0, deposits: 0, investments: 0, earnings: 0 });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) localStorage.setItem('referralCode', refFromUrl);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/admin?action=stats').then(r => r.json()).then(d => {
      setStats({ users: d.totalUsers || 0, deposits: d.totalDeposits || 0, investments: d.activeInvestments || 0, earnings: d.totalEarnings || 0 });
    }).catch(() => {});
  }, []);

  const fmt = (n: number) => n >= 1000 ? `KSh ${(n / 1000).toFixed(0)}K` : `KSh ${n}`;

  return (
    <div className="min-h-screen bg-navy-950">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900 to-brand-100/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/50 border border-brand-600/30 text-brand-500 text-sm font-medium mb-6">
              <Sprout className="w-4 h-4" /> Premium Poultry Investments
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-snow leading-tight">
              Invest in Poultry.<br />
              <span className="text-brand-500">Earn Premium Returns.</span>
            </h1>
            <p className="mt-6 text-lg text-silver max-w-2xl mx-auto">
              SmartNest Farm makes poultry investing simple and profitable. Choose a package, deposit, and watch your flock grow.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login" className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 text-snow font-semibold hover:bg-brand-700 transition shadow-lg shadow-brand-600/20 btn-press">
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/packages" className="flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-brand-600 text-brand-500 font-semibold hover:bg-brand-100/30 transition">
                View Packages
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy-950 border-y border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-snow">Live Platform Stats</h2>
            <p className="mt-2 text-muted">Real-time numbers from our growing community</p>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Users, label: 'Active Investors', value: stats.users || '—', color: 'text-info-500', bg: 'bg-info-100' },
              { icon: Wallet, label: 'Total Deposits', value: stats.deposits ? fmt(stats.deposits) : '—', color: 'text-brand-500', bg: 'bg-brand-100' },
              { icon: BarChart3, label: 'Active Investments', value: stats.investments || '—', color: 'text-accent-500', bg: 'bg-accent-100' },
              { icon: TrendingUp, label: 'Total Earnings', value: stats.earnings ? fmt(stats.earnings) : '—', color: 'text-warn-500', bg: 'bg-warn-100' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5 text-center">
                <div className={`inline-flex p-3 rounded-xl ${s.bg} mb-3`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
                <p className="text-2xl sm:text-3xl font-bold text-snow">{s.value}</p>
                <p className="text-sm text-muted mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-snow">Why SmartNest Farm?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: 'High Returns', desc: 'Earn up to 32% returns on your poultry investment with our premium packages.' },
              { icon: Shield, title: 'Secure & Transparent', desc: 'Bank-grade security with full transparency. Track every transaction in real-time.' },
              { icon: Bird, title: 'Expert Management', desc: 'Our experienced farm managers handle feeding, health, and sales for you.' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-navy-900 rounded-xl p-6 border border-navy-800 hover:border-brand-600/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-brand-500" />
                </div>
                <h3 className="text-lg font-bold text-snow mb-2">{f.title}</h3>
                <p className="text-silver text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community / WhatsApp Section */}
      <section className="py-16 bg-navy-950 border-t border-navy-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-100/50 border border-brand-600/30 text-brand-500 text-sm font-medium mb-4">
              <MessageCircle className="w-4 h-4" /> Community & Support
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-snow mb-3">Join Our WhatsApp Community</h2>
            <p className="text-silver max-w-xl mx-auto mb-8">Connect with fellow investors, get real-time updates, and reach our admin team directly on WhatsApp.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={WHATSAPP_GROUP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#25D366] text-snow font-semibold hover:bg-[#20BD5A] transition shadow-lg shadow-[#25D366]/20 btn-press"
              >
                <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
              </a>
              <a
                href={WHATSAPP_ADMIN}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl border-2 border-brand-600 text-brand-500 font-semibold hover:bg-brand-100/30 transition"
              >
                <Phone className="w-5 h-5" /> Contact Admin on WhatsApp
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-navy-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-snow">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="border border-navy-800 rounded-xl overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left hover:bg-navy-800/50 transition">
                  <span className="font-medium text-snow pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-brand-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted shrink-0" />}
                </button>
                {openFaq === i && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="px-4 pb-4 text-silver text-sm">{faq.a}</motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-r from-brand-700 to-brand-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-snow">Ready to Start Your Poultry Investment?</h2>
          <p className="mt-4 text-brand-200 text-lg">Join hundreds of smart investors earning premium returns with SmartNest Farm.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-snow text-brand-700 font-semibold hover:bg-brand-200 transition shadow-lg btn-press">
              Create Free Account <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href={WHATSAPP_GROUP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-snow/30 text-snow font-semibold hover:bg-snow/10 transition"
            >
              <MessageCircle className="w-5 h-5" /> Join WhatsApp Group
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
