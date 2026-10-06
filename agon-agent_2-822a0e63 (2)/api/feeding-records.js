import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, flock_id } = req.query;
      let query = supabase.from('feeding_records').select('*, flocks(name)');
      if (user_id) query = query.eq('user_id', user_id);
      if (flock_id) query = query.eq('flock_id', flock_id);
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { user_id, flock_id, feed_type, quantity_kg, cost, date } = req.body;
      const { data, error } = await supabase.from('feeding_records').insert({ user_id, flock_id, feed_type, quantity_kg: parseFloat(quantity_kg), cost: parseFloat(cost), date }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('feeding_records').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}