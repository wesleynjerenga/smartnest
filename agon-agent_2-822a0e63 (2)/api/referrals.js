import supabase from './db-client.js';
import { ensureReferralCode } from './referral-code.js';

const REFERRAL_LEVELS = [
  { level: 1, members: 8, weekly_payment: 300 },
  { level: 2, members: 15, weekly_payment: 800 },
  { level: 3, members: 24, weekly_payment: 1500 },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, action } = req.query;

      // Get referral config (admin)
      if (action === 'config') {
        return res.status(200).json({ levels: REFERRAL_LEVELS });
      }

      if (!user_id) return res.status(400).json({ error: 'user_id required' });

      const referralCode = await ensureReferralCode(supabase, user_id);
      const referralLink = new URL(`/?ref=${encodeURIComponent(referralCode)}`, req.headers.origin || 'https://chickensmartfarm.com').toString();

      // Level 1 referrals (directly referred)
      const { data: l1Referrals } = await supabase.from('referrals').select('referred_id').eq('referrer_id', user_id).eq('level', 1);
      const l1Ids = (l1Referrals || []).map(r => r.referred_id);

      // Level 2 referrals (referred by L1 members)
      let l2Ids = [];
      let l2ReferralRows = [];
      if (l1Ids.length > 0) {
        const { data: l2Data } = await supabase.from('referrals').select('referred_id, referrer_id').in('referrer_id', l1Ids).eq('level', 1);
        l2ReferralRows = l2Data || [];
        // Exclude the current user and any L1 members from L2
        l2Ids = l2ReferralRows.map(r => r.referred_id).filter(id => id !== user_id && !l1Ids.includes(id));
        // Deduplicate
        l2Ids = [...new Set(l2Ids)];
      }

      // Get profiles for L1 members
      let l1Members = [];
      if (l1Ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', l1Ids);
        const { data: deposits } = await supabase.from('deposits').select('user_id, total_return, status').in('user_id', l1Ids);
        l1Members = (profiles || []).map(p => {
          const userDeposits = (deposits || []).filter(d => d.user_id === p.user_id && d.status === 'approved');
          const totalInvestment = userDeposits.reduce((s, d) => s + parseFloat(d.total_return), 0);
          const hasPackage = userDeposits.length > 0;
          return {
            user_id: p.user_id,
            full_name: p.full_name || 'Member',
            registration_status: 'Verified',
            package_status: hasPackage ? 'Invested' : 'No Package',
            investment_amount: totalInvestment,
            joined: p.created_at
          };
        });
      }

      // Get profiles for L2 members
      let l2Members = [];
      if (l2Ids.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', l2Ids);
        const { data: deposits } = await supabase.from('deposits').select('user_id, total_return, status').in('user_id', l2Ids);
        l2Members = (profiles || []).map(p => {
          const userDeposits = (deposits || []).filter(d => d.user_id === p.user_id && d.status === 'approved');
          const totalInvestment = userDeposits.reduce((s, d) => s + parseFloat(d.total_return), 0);
          const hasPackage = userDeposits.length > 0;
          return {
            user_id: p.user_id,
            full_name: p.full_name || 'Member',
            registration_status: 'Verified',
            package_status: hasPackage ? 'Invested' : 'No Package',
            investment_amount: totalInvestment,
            joined: p.created_at
          };
        });
      }

      // Team investment total
      const teamInvestment = l1Members.reduce((s, m) => s + m.investment_amount, 0)
        + l2Members.reduce((s, m) => s + m.investment_amount, 0);
      const currentLevel = [...REFERRAL_LEVELS].reverse().find(level => l1Ids.length >= level.members);
      const nextLevel = REFERRAL_LEVELS.find(level => l1Ids.length < level.members);
      const weeklyPayment = currentLevel?.weekly_payment || 0;

      return res.status(200).json({
        referral_code: referralCode,
        referral_link: referralLink,
        config: { levels: REFERRAL_LEVELS },
        stats: {
          level1_count: l1Ids.length,
          level2_count: l2Ids.length,
          team_investment: teamInvestment
        },
        referral_benefit: {
          level: currentLevel?.level || 0,
          member_count: l1Ids.length,
          weekly_payment: weeklyPayment,
          next_level: nextLevel?.level || null,
          members_to_next_level: nextLevel ? nextLevel.members - l1Ids.length : 0,
        },
        level1_members: l1Members,
        level2_members: l2Members
      });
    }

    if (req.method === 'POST') {
      // Register a referral: when a new user signs up with a referral code
      const { new_user_id, referral_code } = req.body;
      if (!new_user_id || !referral_code) return res.status(400).json({ error: 'new_user_id and referral_code required' });

      // Prevent self-referral
      const normalizedCode = String(referral_code).trim().toUpperCase();
      const { data: codeRow } = await supabase.from('referral_codes').select('user_id, code').eq('code', normalizedCode).single();
      if (!codeRow) return res.status(400).json({ error: 'Invalid referral code' });
      if (codeRow.user_id === new_user_id) return res.status(400).json({ error: 'Self-referral not allowed' });

      // Check if already referred
      const { data: existing } = await supabase.from('referrals').select('id').eq('referred_id', new_user_id).eq('level', 1).single();
      if (existing) return res.status(200).json({ ok: true, message: 'Already referred' });

      const referrerId = codeRow.user_id;

      // Create Level 1 referral
      await supabase.from('referrals').insert({ referrer_id: referrerId, referred_id: new_user_id, level: 1 });

      // Check if the referrer was themselves referred (Level 2)
      const { data: referrersReferrer } = await supabase.from('referrals').select('referrer_id').eq('referred_id', referrerId).eq('level', 1).single();
      if (referrersReferrer && referrersReferrer.referrer_id !== new_user_id) {
        // Create Level 2 referral
        const { data: existingL2 } = await supabase.from('referrals').select('id')
          .eq('referrer_id', referrersReferrer.referrer_id)
          .eq('referred_id', new_user_id)
          .eq('level', 2).single();
        if (!existingL2) {
          await supabase.from('referrals').insert({ referrer_id: referrersReferrer.referrer_id, referred_id: new_user_id, level: 2 });
        }
      }

      // Send notification to referrer
      await supabase.from('notifications').insert({
        user_id: referrerId,
        title: 'New Team Member!',
        message: `A new member has joined your Level 1 team through your referral link.`,
        read: false
      });

      return res.status(201).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: err.message });
  }
}