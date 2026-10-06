import supabase from './db-client.js';
import { createClient } from '@supabase/supabase-js';

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
    if (req.method === 'GET') {
      const { user_id, status } = req.query;
      let query = supabase.from('withdrawals').select('*');
      if (user_id) query = query.eq('user_id', user_id);
      if (status) query = query.eq('status', status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { user_id, amount, method, phone } = req.body;
      if (!user_id || !amount || !method) return res.status(400).json({ success: false, error: 'Missing required fields' });
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < 200) return res.status(400).json({ success: false, error: 'Minimum withdrawal amount is KSh 200' });
      const { data, error } = await supabase.from('withdrawals').insert({ user_id, amount: numAmount, method, phone, status: 'pending' }).select().single();
      if (error) throw error;
      await supabase.from('transactions').insert({ user_id, type: 'withdrawal', amount: numAmount, description: `Withdrawal request via ${method}`, status: 'pending', reference_id: data.id });
      await supabase.from('notifications').insert({ user_id, title: 'Withdrawal Requested', message: `Your withdrawal of KES ${numAmount.toLocaleString()} via ${method} is pending approval.`, read: false });
      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const adminUser = await verifyAdmin(req);
      if (!adminUser) return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });

      const { id, status, admin_note } = req.body;
      if (!id || !status) return res.status(400).json({ success: false, error: 'id and status required' });
      if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });

      // Fetch the REAL transaction from DB
      const { data: withdrawal, error: fetchErr } = await supabase.from('withdrawals').select('*').eq('id', id).single();
      if (fetchErr || !withdrawal) return res.status(404).json({ success: false, error: 'Withdrawal not found' });

      // DUPLICATE PREVENTION: Only pending transactions can be processed
      if (withdrawal.status !== 'pending') {
        return res.status(409).json({ success: false, error: `Transaction is already ${withdrawal.status} and cannot be changed` });
      }

      const now = new Date().toISOString();
      const updateData = {
        status,
        admin_note: admin_note || null,
        approved_by: adminUser.id,
        approved_at: now,
      };
      const { data, error } = await supabase.from('withdrawals').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      if (status === 'approved') {
        // Update transaction status to completed
        await supabase.from('transactions').update({ status: 'completed' }).eq('reference_id', id).eq('type', 'withdrawal');
        await supabase.from('notifications').insert({
          user_id: withdrawal.user_id, title: 'Withdrawal Approved',
          message: `Your withdrawal of KES ${parseFloat(withdrawal.amount).toLocaleString()} has been approved and processed.`,
          read: false
        });
      } else if (status === 'rejected') {
        // Rejected withdrawal - no deduction made
        await supabase.from('transactions').update({ status: 'failed' }).eq('reference_id', id).eq('type', 'withdrawal');
        await supabase.from('notifications').insert({
          user_id: withdrawal.user_id, title: 'Withdrawal Rejected',
          message: `Your withdrawal of KES ${parseFloat(withdrawal.amount).toLocaleString()} has been rejected.${admin_note ? ` Reason: ${admin_note}` : ''}`,
          read: false
        });
      }

      return res.status(200).json({ success: true, message: `Withdrawal ${status} successfully`, data });
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API error [withdrawals]:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
