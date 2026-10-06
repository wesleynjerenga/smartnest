import { Bird, MessageCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const WHATSAPP_GROUP = 'https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1';
const WHATSAPP_ADMIN = 'https://wa.me/254711232538';

export default function Footer() {
  return (
    <footer className="bg-navy-900 border-t border-navy-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center">
                <Bird className="w-5 h-5 text-snow" />
              </div>
              <span className="text-lg font-bold text-snow tracking-tight">Smart<span className="text-brand-500">Nest</span></span>
            </Link>
            <p className="text-sm text-muted leading-relaxed">
              Premium poultry investment platform. Invest in managed flocks and earn consistent returns.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-snow uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              <li><Link to="/packages" className="text-sm text-silver hover:text-brand-500 transition">Investment Packages</Link></li>
              <li><Link to="/deposit" className="text-sm text-silver hover:text-brand-500 transition">Make a Deposit</Link></li>
              <li><Link to="/withdrawals" className="text-sm text-silver hover:text-brand-500 transition">Withdrawals</Link></li>
              <li><Link to="/my-team" className="text-sm text-silver hover:text-brand-500 transition">Referral Program</Link></li>
            </ul>
          </div>

          {/* Community & Support */}
          <div>
            <h3 className="text-sm font-semibold text-snow uppercase tracking-wider mb-4">Community</h3>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={WHATSAPP_GROUP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-brand-500 hover:text-brand-400 font-medium transition"
                >
                  <MessageCircle className="w-4 h-4" /> Join WhatsApp Group
                </a>
              </li>
              <li>
                <a
                  href={WHATSAPP_ADMIN}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-silver hover:text-brand-500 transition"
                >
                  <Phone className="w-4 h-4" /> Contact Admin on WhatsApp
                </a>
              </li>
            </ul>
          </div>

          {/* Rules */}
          <div>
            <h3 className="text-sm font-semibold text-snow uppercase tracking-wider mb-4">Important Info</h3>
            <ul className="space-y-2.5">
              <li className="text-sm text-silver">Minimum Withdrawal: <span className="font-semibold text-snow">KSh 200</span></li>
              <li className="text-sm text-silver">Withdrawals processed within 24–48 hours</li>
              <li className="text-sm text-silver">All deposits verified by admin</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-navy-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">© 2026 SmartNest Farm Investment. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a
              href={WHATSAPP_GROUP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-snow text-xs font-semibold hover:bg-brand-700 transition shadow-md shadow-brand-600/20 btn-press"
            >
              <MessageCircle className="w-3.5 h-3.5" /> Join WhatsApp Group
            </a>
            <a
              href={WHATSAPP_ADMIN}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-navy-700 text-silver text-xs font-medium hover:text-snow hover:border-navy-600 transition"
            >
              <Phone className="w-3.5 h-3.5" /> Contact Admin
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}