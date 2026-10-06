import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Wheat, Plus, X, Trash2 } from 'lucide-react';

export default function FeedingRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [flocks, setFlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ flock_id: '', feed_type: '', quantity_kg: '', cost: '', date: new Date().toISOString().split('T')[0] });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [rRes, fRes] = await Promise.all([fetch(`/api/feeding-records?user_id=${user.id}`), fetch(`/api/flocks?user_id=${user.id}`)]);
      setRecords(await rRes.json()); setFlocks(await fRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setSubmitting(true);
    try {
      await fetch('/api/feeding-records', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, ...form }) });
      setShowForm(false); setForm({ flock_id: '', feed_type: '', quantity_kg: '', cost: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    await fetch('/api/feeding-records', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchData();
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-snow">Feeding Records</h1><p className="text-muted text-sm">Track feed consumption and costs</p></div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-snow text-sm font-medium hover:bg-brand-700 transition"><Plus className="w-4 h-4" /> Add Record</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-snow">Add Feeding Record</h2><button onClick={() => setShowForm(false)} className="text-muted hover:text-snow"><X className="w-5 h-5" /></button></div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-silver mb-1">Flock</label><select value={form.flock_id} onChange={e => setForm({...form, flock_id: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm"><option value="">Select flock</option>{flocks.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Feed Type</label><input type="text" value={form.feed_type} onChange={e => setForm({...form, feed_type: e.target.value})} required placeholder="e.g. Layer Mash" className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Quantity (kg)</label><input type="number" step="0.1" min="0.1" value={form.quantity_kg} onChange={e => setForm({...form, quantity_kg: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Cost (KES)</label><input type="number" min="0" value={form.cost} onChange={e => setForm({...form, cost: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div className="flex items-end"><button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 disabled:opacity-50 transition text-sm">{submitting ? 'Saving...' : 'Save'}</button></div>
          </form>
        </motion.div>
      )}

      <div className="bg-navy-900 rounded-xl border border-navy-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-navy-900"><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Date</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Flock</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Feed</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Qty</th><th className="px-4 py-3 text-left text-xs font-medium text-muted uppercase">Cost</th><th className="px-4 py-3 w-10"></th></tr></thead>
            <tbody className="divide-y divide-navy-800">
              {records.map((r: any) => (
                <tr key={r.id} className="hover:bg-navy-800">
                  <td className="px-4 py-3 text-snow">{r.date}</td>
                  <td className="px-4 py-3 text-silver">{r.flocks?.name || '—'}</td>
                  <td className="px-4 py-3 text-silver">{r.feed_type}</td>
                  <td className="px-4 py-3 text-silver">{r.quantity_kg} kg</td>
                  <td className="px-4 py-3 font-medium text-snow">KSh {parseFloat(r.cost).toLocaleString()}</td>
                  <td className="px-4 py-3"><button onClick={() => handleDelete(r.id)} className="text-danger-500 hover:text-danger-600"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No feeding records</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}