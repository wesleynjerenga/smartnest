import supabase from './db-client.js';
import { createClient } from '@supabase/supabase-js';

// Verify admin access via Authorization token
async function verifyAdmin(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );
  
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return null;
  
  // Check profile role
  const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
  if (!profile || profile.role !== 'admin') return null;
  
  return user;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Verify admin for all requests
    const adminUser = await verifyAdmin(req);
    if (!adminUser) {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    if (req.method === 'GET') {
      const { action } = req.query;
      if (action === 'stats') {
        const [usersRes, depositsRes, investmentsRes, withdrawalsRes, salesRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('deposits').select('total_return, status'),
          supabase.from('investments').select('amount, returns, status'),
          supabase.from('withdrawals').select('amount, status'),
          supabase.from('sales').select('total')
        ]);
        const totalDeposits = depositsRes.data?.filter(d => d.status === 'approved').reduce((s, d) => s + parseFloat(d.total_return), 0) || 0;
        const pendingDeposits = depositsRes.data?.filter(d => d.status === 'pending').length || 0;
        const activeInvestments = investmentsRes.data?.filter(i => i.status === 'active').length || 0;
        const totalEarnings = investmentsRes.data?.filter(i => i.status === 'active').reduce((s, i) => s + (parseFloat(i.returns) - parseFloat(i.amount)), 0) || 0;
        const totalWithdrawals = withdrawalsRes.data?.filter(w => w.status === 'approved').reduce((s, w) => s + parseFloat(w.amount), 0) || 0;
        const pendingWithdrawals = withdrawalsRes.data?.filter(w => w.status === 'pending').length || 0;
        const totalSales = salesRes.data?.reduce((s, sale) => s + parseFloat(sale.total), 0) || 0;
        return res.status(200).json({
          totalUsers: usersRes.count || 0,
          totalDeposits, pendingDeposits,
          activeInvestments, totalEarnings,
          totalWithdrawals, pendingWithdrawals,
          totalSales
        });
      }
      if (action === 'users') {
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'deposits') {
        const { status } = req.query;
        let query = supabase.from('deposits').select('*, profiles(full_name, phone)').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'withdrawals') {
        const { data, error } = await supabase.from('withdrawals').select('*, profiles(full_name, phone)').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'investments') {
        const { data, error } = await supabase.from('investments').select('*, profiles(full_name)').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'feeding') {
        const { data, error } = await supabase.from('feeding_records').select('*, flocks(name), profiles(full_name)').order('date', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'sales') {
        const { data, error } = await supabase.from('sales').select('*, flocks(name), profiles(full_name)').order('date', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      if (action === 'claims') {
        const { data, error } = await supabase.from('claims').select('*, profiles(full_name)').order('created_at', { ascending: false });
        if (error) throw error;
        return res.status(200).json(data);
      }
      return res.status(400).json({ error: 'Unknown action' });
    }
    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
