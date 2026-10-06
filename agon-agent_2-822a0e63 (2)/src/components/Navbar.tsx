import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import { Menu, X, Home, LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, ShoppingCart, Wheat, Bird, User, Bell, LogOut, Shield, Users, ChevronRight, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const userLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/packages', label: 'Packages', icon: Package },
    { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { to: '/withdrawals', label: 'Withdraw', icon: ArrowUpFromLine },
    { to: '/flocks', label: 'Flocks', icon: Bird },
    { to: '/sales', label: 'Sales', icon: ShoppingCart },
    { to: '/feeding', label: 'Feeding', icon: Wheat },
    { to: '/my-team', label: 'My Team', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-navy-900/95 backdrop-blur-xl border-b border-navy-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-600/20 group-hover:shadow-brand-600/40 transition-shadow">
              <Bird className="w-5 h-5 text-snow" />
            </div>
            <span className="text-lg font-bold text-snow tracking-tight">Smart<span className="text-brand-500">Nest</span></span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            <Link to="/" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/') ? 'text-brand-500 bg-brand-100/40' : 'text-silver hover:text-snow hover:bg-navy-800/50'}`}>
              <Home className="w-4 h-4" />Home
            </Link>
            {user && userLinks.map(l => (
              <Link key={l.to} to={l.to} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(l.to) ? 'text-brand-500 bg-brand-100/40' : 'text-silver hover:text-snow hover:bg-navy-800/50'}`}>
                <l.icon className="w-4 h-4" />{l.label}
              </Link>
            ))}
            {isAdmin && (
              <Link to="/admin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/admin') ? 'text-accent-500 bg-accent-100/40' : 'text-accent-500 hover:text-accent-400 hover:bg-accent-100/20'}`}>
                <Shield className="w-4 h-4" />Admin
              </Link>
            )}
          </div>

          {/* Desktop right */}
          <div className="flex items-center gap-1.5">
            {user ? (
              <>
                <a href="https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1" target="_blank" rel="noopener noreferrer" className="hidden sm:flex p-2 rounded-lg text-silver hover:text-[#25D366] hover:bg-navy-800/50 transition-all" title="Join WhatsApp Group">
                  <MessageCircle className="w-5 h-5" />
                </a>
                <Link to="/notifications" className="hidden sm:flex p-2 rounded-lg text-silver hover:text-brand-500 hover:bg-navy-800/50 transition-all">
                  <Bell className="w-5 h-5" />
                </Link>
                <Link to="/profile" className="hidden sm:flex p-2 rounded-lg text-silver hover:text-brand-500 hover:bg-navy-800/50 transition-all">
                  <User className="w-5 h-5" />
                </Link>
                <button onClick={handleLogout} className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-100/20 transition-all">
                  <LogOut className="w-4 h-4" /><span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm bg-brand-600 text-snow hover:bg-brand-700 transition-all font-semibold shadow-lg shadow-brand-600/20 btn-press">
                Sign In
              </Link>
            )}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded-lg text-silver hover:text-snow hover:bg-navy-800/50 transition-all">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-navy-800 bg-navy-900/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-3 space-y-0.5">
              <Link to="/" onClick={() => setMobileOpen(false)} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive('/') ? 'text-brand-500 bg-brand-100/40' : 'text-silver hover:text-snow hover:bg-navy-800/50'}`}>
                <span className="flex items-center gap-2.5"><Home className="w-4 h-4"/>Home</span>
                {isActive('/') && <ChevronRight className="w-4 h-4" />}
              </Link>
              {user && userLinks.map(l => (
                <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${isActive(l.to) ? 'text-brand-500 bg-brand-100/40' : 'text-silver hover:text-snow hover:bg-navy-800/50'}`}>
                  <span className="flex items-center gap-2.5"><l.icon className="w-4 h-4" />{l.label}</span>
                  {isActive(l.to) && <ChevronRight className="w-4 h-4" />}
                </Link>
              ))}
              {user && (
                <>
                  <a href="https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[#25D366] hover:bg-navy-800/50 font-medium">
                    <MessageCircle className="w-4 h-4" /> WhatsApp Group
                  </a>
                  <Link to="/transactions" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-silver hover:text-snow hover:bg-navy-800/50">
                    <ShoppingCart className="w-4 h-4" />Transactions
                  </Link>
                  <Link to="/notifications" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-silver hover:text-snow hover:bg-navy-800/50">
                    <Bell className="w-4 h-4" />Notifications
                  </Link>
                  <Link to="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-silver hover:text-snow hover:bg-navy-800/50">
                    <User className="w-4 h-4" />Profile
                  </Link>
                </>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-accent-500 font-medium hover:bg-accent-100/20">
                  <Shield className="w-4 h-4" />Admin Dashboard
                </Link>
              )}
              <div className="pt-2 border-t border-navy-800">
                {user ? (
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-danger-500 hover:bg-danger-100/20 w-full">
                    <LogOut className="w-4 h-4" />Logout
                  </button>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-brand-600 text-snow hover:bg-brand-700 font-semibold btn-press">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
