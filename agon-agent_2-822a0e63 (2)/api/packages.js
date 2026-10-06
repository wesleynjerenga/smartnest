import supabase from './db-client.js';
import { applyPackageRules } from './package-rules.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { active } = req.query;
      let query = supabase.from('packages').select('*');
      if (active === 'true') query = query.eq('active', true);
      const { data, error } = await query.order('price', { ascending: true });
      if (error) throw error;
      return res.status(200).json(applyPackageRules(data));
    }
    if (req.method === 'POST') {
      const { name, price, description, returns_rate, min_birds, max_birds, active } = req.body;
      const { data, error } = await supabase.from('packages').insert({ name, price, description, returns_rate, min_birds, max_birds, active: active !== undefined ? active : true }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }
    if (req.method === 'PUT') {
      const { id, ...updates } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { data, error } = await supabase.from('packages').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: 'id required' });
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}