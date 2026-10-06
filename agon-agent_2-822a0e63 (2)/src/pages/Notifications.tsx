import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/notifications?user_id=${user.id}`);
      setNotifications(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [user?.id]);

  const markRead = async (id: number) => {
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, read: true }) });
    fetchNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await fetch('/api/notifications', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, read: true }) });
    fetchNotifications();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-snow">Notifications</h1><p className="text-muted text-sm">{unread} unread</p></div>
        {unread > 0 && <button onClick={markAllRead} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-navy-800 text-silver text-sm font-medium hover:bg-navy-800 transition"><CheckCheck className="w-4 h-4" /> Mark all read</button>}
      </div>

      <div className="space-y-3">
        {notifications.map((n: any) => (
          <motion.div key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`bg-navy-900 rounded-xl border p-4 ${n.read ? 'border-navy-800' : 'border-brand-600/30 bg-brand-100/50'}`}>
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${n.read ? 'bg-navy-900' : 'bg-brand-100'}`}>
                <Bell className={`w-4 h-4 ${n.read ? 'text-muted' : 'text-brand-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-snow text-sm">{n.title}</h3>
                  {!n.read && <button onClick={() => markRead(n.id)} className="p-1 text-brand-600 hover:bg-brand-100 hover:bg-brand-100/30 rounded"><Check className="w-3.5 h-3.5" /></button>}
                </div>
                <p className="text-sm text-silver mt-0.5">{n.message}</p>
                <p className="text-xs text-muted mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          </motion.div>
        ))}
        {notifications.length === 0 && <div className="text-center py-12 text-muted">No notifications</div>}
      </div>
    </div>
  );
}