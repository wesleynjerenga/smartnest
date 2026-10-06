import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('sales').select('*, flocks(name)');
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { user_id, flock_id, buyer, quantity, price_per_unit, date } = req.body;
      const qty = parseInt(quantity);
      const ppu = parseFloat(price_per_unit);
      const total = qty * ppu;
      const { data, error } = await supabase.from('sales').insert({ user_id, flock_id, buyer, quantity: qty, price_per_unit: ppu, total, date }).select().single();
      if (error) throw error;
      await supabase.from('transactions').insert({ user_id, type: 'sale', amount: total, description: `Sale: ${qty} birds to ${buyer}`, status: 'completed', reference_id: data.id });
      return res.status(201).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}