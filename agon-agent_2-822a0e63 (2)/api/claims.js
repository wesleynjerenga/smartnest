import supabase from './db-client.js';

const CLAIM_HOURS = 24;
const HOURS_MS = CLAIM_HOURS * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, investment_id } = req.query;
      if (!user_id) return res.status(400).json({ error: 'user_id required' });
      let query = supabase.from('claims').select('*');
      query = query.eq('user_id', user_id);
      if (investment_id) query = query.eq('investment_id', parseInt(investment_id));
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      const now = new Date();
      const enriched = (data || []).map(claim => {
        const activatedAt = claim.activated_at ? new Date(claim.activated_at) : null;
        const claimableAt = activatedAt ? new Date(activatedAt.getTime() + HOURS_MS) : null;
        const isClaimable = claim.status === 'locked' && claimableAt && now >= claimableAt;
        const isClaimed = claim.status === 'claimed';
        const remainingMs = claimableAt ? Math.max(0, claimableAt.getTime() - now.getTime()) : 0;
        return {
          ...claim,
          claimable_at: claimableAt ? claimableAt.toISOString() : null,
          is_claimable: isClaimable,
          is_claimed: isClaimed,
          remaining_ms: remainingMs,
          remaining_hours: Math.floor(remainingMs / (60 * 60 * 1000)),
          remaining_minutes: Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)),
          remaining_seconds: Math.floor((remainingMs % (60 * 1000)) / 1000),
        };
      });

      return res.status(200).json(enriched);
    }

    if (req.method === 'POST') {
      const { investment_id, user_id } = req.body;
      if (!investment_id || !user_id) return res.status(400).json({ error: 'investment_id and user_id required' });

      const { data: claim, error: claimErr } = await supabase.from('claims')
        .select('*')
        .eq('investment_id', investment_id)
        .eq('user_id', user_id)
        .single();
      if (claimErr || !claim) return res.status(404).json({ error: 'Claim record not found' });

      if (claim.status === 'claimed') return res.status(400).json({ error: 'Package already claimed' });

      const now = new Date();
      const activatedAt = claim.activated_at ? new Date(claim.activated_at) : null;
      if (!activatedAt) return res.status(400).json({ error: 'Package not yet activated' });

      const claimableAt = new Date(activatedAt.getTime() + HOURS_MS);
      if (now < claimableAt) {
        const remainingMs = claimableAt.getTime() - now.getTime();
        const remainingHours = Math.floor(remainingMs / (60 * 60 * 1000));
        const remainingMinutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
        return res.status(403).json({
          error: `Claim not available yet. Available in ${remainingHours}h ${remainingMinutes}m`,
          claimable_at: claimableAt.toISOString(),
          remaining_ms: remainingMs,
        });
      }

      const { data, error } = await supabase.from('claims')
        .update({ status: 'claimed', claimed_at: now.toISOString() })
        .eq('id', claim.id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from('investments').update({ status: 'claimed' }).eq('id', investment_id);

      await supabase.from('transactions').insert({
        user_id,
        type: 'claim',
        amount: claim.amount,
        description: `Claim: ${claim.package_name} - KSh ${parseFloat(claim.amount).toLocaleString()}`,
        status: 'completed',
        reference_id: claim.id,
      });

      await supabase.from('notifications').insert({
        user_id,
        title: 'Package Claimed!',
        message: `Your ${claim.package_name} package has been claimed successfully. KSh ${parseFloat(claim.amount).toLocaleString()} has been credited.`,
        read: false,
      });

      return res.status(200).json({
        ...data,
        is_claimable: false,
        is_claimed: true,
      });
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body;
      if (!id || !status) return res.status(400).json({ error: 'id and status required' });
      const updateData = { status };
      if (status === 'claimed') updateData.claimed_at = new Date().toISOString();
      const { data, error } = await supabase.from('claims').update(updateData).eq('id', id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}
