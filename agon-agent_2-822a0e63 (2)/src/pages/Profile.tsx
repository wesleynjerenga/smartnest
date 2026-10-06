import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import supabase from '../lib/supabase';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, CheckCircle, Lock, Eye, EyeOff,KeyRound } from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [pwChanged, setPwChanged] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setLoading(false);
    } else if (user) {
      setFullName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
      setLoading(false);
    }
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true); setSaved(false);
    try {
      await fetch('/api/profiles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, full_name: fullName, phone }),
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match');
      return;
    }
    setChangingPw(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPwChanged(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwChanged(false), 3000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-snow mb-2">Profile</h1>
        <p className="text-muted mb-8">Manage your personal information</p>

        <div className="bg-navy-900 rounded-xl border border-navy-800 p-6">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-navy-800">
            <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center">
              <User className="w-8 h-8 text-brand-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-snow">{fullName || 'User'}</h2>
              <p className="text-sm text-muted">{user?.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-500">
                {profile?.role === 'admin' ? 'Admin' : 'Investor'}
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="email" readOnly value={user?.email || ''} className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-900 text-muted text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+2547XXXXXXXX" className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600" />
              </div>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 disabled:opacity-50 transition text-sm btn-press">
                {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}</>}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="mt-6 bg-navy-900 rounded-xl border border-navy-800 p-6">
          <h3 className="font-bold text-snow mb-4 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-500" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-silver mb-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setPwError(''); }}
                  required
                  minLength={6}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600 placeholder:text-muted"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-snow">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-silver mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setPwError(''); }}
                  required
                  minLength={6}
                  placeholder="Re-enter new password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm focus:ring-2 focus:ring-brand-600 placeholder:text-muted"
                />
              </div>
            </div>
            {pwError && <p className="text-danger-500 text-sm">{pwError}</p>}
            <button
              type="submit"
              disabled={changingPw || !newPassword || !confirmPassword}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 disabled:opacity-50 transition text-sm btn-press"
            >
              {pwChanged ? <><CheckCircle className="w-4 h-4" /> Password Updated!</> : <><Lock className="w-4 h-4" /> {changingPw ? 'Updating...' : 'Change Password'}</>}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-navy-900 rounded-xl border border-navy-800 p-6">
          <h3 className="font-bold text-snow mb-3">Account Details</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-muted">Member Since</p><p className="font-medium text-snow">{new Date(user?.created_at || '').toLocaleDateString()}</p></div>
            <div><p className="text-muted">Account ID</p><p className="font-mono text-xs text-snow truncate">{user?.id?.slice(0, 16)}...</p></div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
