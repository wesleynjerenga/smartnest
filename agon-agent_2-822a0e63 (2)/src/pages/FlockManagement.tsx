import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Bird, Plus, X, Trash2, Edit3 } from 'lucide-react';

export default function FlockManagement() {
  const { user } = useAuth();
  const [flocks, setFlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', breed: 'Broiler', count: '', age_weeks: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchFlocks = async () => {
    if (!user) return;
    try { const res = await fetch(`/api/flocks?user_id=${user.id}`); setFlocks(await res.json()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchFlocks(); }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setSubmitting(true);
    try {
      if (editing) {
        await fetch('/api/flocks', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editing.id, ...form }) });
      } else {
        await fetch('/api/flocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: user.id, ...form, status: 'active' }) });
      }
      setShowForm(false); setEditing(null); setForm({ name: '', breed: 'Broiler', count: '', age_weeks: '' });
      fetchFlocks();
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: number) => {
    await fetch('/api/flocks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchFlocks();
  };

  const startEdit = (f: any) => {
    setEditing(f); setForm({ name: f.name, breed: f.breed, count: String(f.count), age_weeks: String(f.age_weeks) }); setShowForm(true);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><LoadingSpinner /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-snow">Flock Management</h1><p className="text-muted text-sm">Manage your chicken flocks</p></div>
        <button onClick={() => { setEditing(null); setForm({ name: '', breed: 'Broiler', count: '', age_weeks: '' }); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-snow text-sm font-medium hover:bg-brand-700 transition"><Plus className="w-4 h-4" /> Add Flock</button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-snow">{editing ? 'Edit Flock' : 'Add Flock'}</h2><button onClick={() => { setShowForm(false); setEditing(null); }} className="text-muted hover:text-snow"><X className="w-5 h-5" /></button></div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-silver mb-1">Flock Name</label><input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Breed</label><select value={form.breed} onChange={e => setForm({...form, breed: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm"><option>Broiler</option><option>Layers</option><option>Kienyeji</option></select></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Count</label><input type="number" min="1" value={form.count} onChange={e => setForm({...form, count: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div><label className="block text-sm font-medium text-silver mb-1">Age (weeks)</label><input type="number" min="0" value={form.age_weeks} onChange={e => setForm({...form, age_weeks: e.target.value})} required className="w-full px-3 py-2 rounded-lg border border-navy-800 bg-navy-950 text-snow text-sm" /></div>
            <div className="sm:col-span-2"><button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg bg-brand-600 text-snow font-medium hover:bg-brand-700 disabled:opacity-50 transition text-sm">{submitting ? 'Saving...' : 'Save'}</button></div>
          </form>
        </motion.div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {flocks.map((f: any) => (
          <motion.div key={f.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-navy-900 rounded-xl border border-navy-800 p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2"><div className="p-2 rounded-lg bg-brand-100"><Bird className="w-4 h-4 text-brand-500" /></div><h3 className="font-bold text-snow">{f.name}</h3></div>
              <div className="flex gap-1"><button onClick={() => startEdit(f)} className="p-1 text-muted hover:text-brand-500 transition"><Edit3 className="w-4 h-4" /></button><button onClick={() => handleDelete(f.id)} className="p-1 text-muted hover:text-danger-500 transition"><Trash2 className="w-4 h-4" /></button></div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-navy-900"><p className="text-xs text-muted">Breed</p><p className="text-sm font-medium text-snow">{f.breed}</p></div>
              <div className="p-2 rounded-lg bg-navy-900"><p className="text-xs text-muted">Count</p><p className="text-sm font-medium text-snow">{f.count}</p></div>
              <div className="p-2 rounded-lg bg-navy-900"><p className="text-xs text-muted">Age</p><p className="text-sm font-medium text-snow">{f.age_weeks}w</p></div>
            </div>
          </motion.div>
        ))}
        {flocks.length === 0 && <div className="sm:col-span-2 lg:col-span-3 text-center py-12 text-muted">No flocks yet. Add your first flock!</div>}
      </div>
    </div>
  );
}