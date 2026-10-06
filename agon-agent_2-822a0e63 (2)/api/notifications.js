import supabase from './db-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('notifications').select('*');
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'PUT') {
      const { id, read, user_id } = req.body;
      if (id) {
        const { data, error } = await supabase.from('notifications').update({ read }).eq('id', id).select().single();
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (user_id && read !== undefined) {
        const { data, error } = await supabase.from('notifications').update({ read }).eq('user_id', user_id).select();
        if (error) throw error;
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'id or user_id required' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}