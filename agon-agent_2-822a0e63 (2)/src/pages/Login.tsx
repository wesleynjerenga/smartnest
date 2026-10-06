import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signInWithGoogle } from '../lib/googleAuth';
import supabase from '../lib/supabase';
import { motion } from 'framer-motion';
import { Bird, Mail, Lock, Eye, EyeOff, ArrowRight, MessageCircle, Phone, KeyRound } from 'lucide-react';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || localStorage.getItem('referralCode') || '';

  useEffect(() => {
    const refFromUrl = searchParams.get('ref');
    if (refFromUrl) localStorage.setItem('referralCode', refFromUrl);
  }, [searchParams]);

  if (user) { navigate('/dashboard'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        });
        if (signUpError) throw signUpError;
        const newUserId = (await supabase.auth.getUser()).data.user?.id;
        await fetch('/api/profiles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: newUserId, full_name: fullName, phone: '', role: 'user' }),
        });
        if (referralCode && newUserId) {
          try {
            await fetch('/api/referrals', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ new_user_id: newUserId, referral_code: referralCode }),
            });
            localStorage.removeItem('referralCode');
          } catch (refErr) { console.error('Referral registration failed:', refErr); }
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-600 mb-4">
            <Bird className="w-8 h-8 text-snow" />
          </div>
          <h1 className="text-2xl font-bold text-snow">SmartNest Farm</h1>
          <p className="text-muted mt-1">{isSignUp ? 'Create your account' : 'Welcome back'}</p>
        </div>

        <div className="bg-navy-900 rounded-2xl border border-navy-800 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-silver mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full px-3.5 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow focus:ring-2 focus:ring-brand-600 focus:border-brand-600 text-sm placeholder:text-muted" placeholder="John Doe" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow focus:ring-2 focus:ring-brand-600 focus:border-brand-600 text-sm placeholder:text-muted" placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow focus:ring-2 focus:ring-brand-600 focus:border-brand-600 text-sm placeholder:text-muted" placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-snow">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-danger-500 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-brand-600 text-snow font-semibold hover:bg-brand-700 disabled:opacity-50 transition text-sm">
              {loading ? 'Please wait...' : <> {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-navy-800" />
            <span className="text-xs text-muted">or</span>
            <div className="flex-1 h-px bg-navy-800" />
          </div>

          <button onClick={() => signInWithGoogle()} className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-silver font-medium hover:bg-navy-800 transition text-sm">
            <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.24c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-sm text-muted">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-brand-500 font-medium hover:underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          {!isSignUp && (
            <p className="mt-2 text-center text-sm">
              <button
                onClick={async () => {
                  if (!email) { setError('Enter your email above first'); return; }
                  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email);
                  if (resetErr) setError(resetErr.message);
                  else setError('Password reset email sent! Check your inbox.');
                }}
                className="text-muted hover:text-brand-500 transition inline-flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Forgot Password?
              </button>
            </p>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Demo: demo@smartnest.farm / password123
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <a href="https://chat.whatsapp.com/Km4AG5RoLLZ2mVD49cNTSW?s=sh&p=a&ilr=1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25D366] text-snow text-xs font-semibold hover:bg-[#20BD5A] transition btn-press">
            <MessageCircle className="w-3.5 h-3.5" /> Join WhatsApp Group
          </a>
          <a href="https://wa.me/254711232538" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-navy-700 text-silver text-xs font-medium hover:text-snow transition">
            <Phone className="w-3.5 h-3.5" /> Contact Admin
          </a>
        </div>
      </motion.div>
    </div>
  );
}
