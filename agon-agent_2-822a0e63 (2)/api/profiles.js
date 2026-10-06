import supabase from './db-client.js';
import { ensureReferralCode } from './referral-code.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id } = req.query;
      let query = supabase.from('profiles').select('*');
      if (user_id) query = query.eq('user_id', user_id);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }
    if (req.method === 'POST') {
      const { user_id, full_name, phone, role, avatar_url } = req.body;
      const { data, error } = await supabase.from('profiles').insert({ user_id, full_name, phone, role: role || 'user', avatar_url }).select().single();
      if (error) throw error;

      const referral_code = await ensureReferralCode(supabase, user_id);
      return res.status(201).json({ ...data, referral_code });
    }
    if (req.method === 'PUT') {
      const { user_id, ...updates } = req.body;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', user_id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}