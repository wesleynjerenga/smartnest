import { timingSafeEqual } from 'node:crypto';
import supabase from './db-client.js';

function isAuthorized(req, secret) {
  const authorization = req.headers.authorization || '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedBuffer = Buffer.from(secret);
  const suppliedBuffer = Buffer.from(supplied);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

function currentWeekStart() {
  const date = new Date();
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = process.env.CRON_SECRET;
  if (!secret) return res.status(503).json({ error: 'Weekly payout job is not configured' });
  if (!isAuthorized(req, secret)) return res.status(401).json({ error: 'Unauthorized' });

  const weekStart = currentWeekStart();
  try {
    const { data, error } = await supabase.rpc('process_weekly_referral_payouts', {
      p_week_start: weekStart,
    });
    if (error) throw error;
    return res.status(200).json({
      success: true,
      week_start: weekStart,
      payouts_created: data?.length || 0,
      payouts: data || [],
    });
  } catch (error) {
    console.error('API error [referral-weekly-payouts]:', error);
    return res.status(500).json({ error: 'Failed to process weekly referral payouts' });
  }
}