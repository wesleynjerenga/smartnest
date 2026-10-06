import supabase from './db-client.js';
import { createClient } from '@supabase/supabase-js';
import { getPackageTerms } from './package-rules.js';

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

function fmtKES(n) {
  return Math.round(n).toLocaleString();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      const { user_id, status } = req.query;
      let query = supabase.from('deposits').select('*');
      if (user_id) query = query.eq('user_id', user_id);
      if (status) query = query.eq('status', status);
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const {
        user_id, package_id, package_name,
        chicken_type, avg_weight, num_birds,
        pay_method, transaction_ref, phone_used
      } = req.body;
      if (!user_id || !package_id) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const { data: pkg, error: packageError } = await supabase
        .from('packages').select('*').eq('id', package_id).single();
      if (packageError || !pkg || pkg.active === false) {
        return res.status(404).json({ success: false, error: 'Package not found or unavailable' });
      }
      const terms = getPackageTerms(pkg);
      if (!terms) return res.status(400).json({ success: false, error: 'Package terms are unavailable' });

      const { count, error: countError } = await supabase
        .from('deposits').select('id', { count: 'exact', head: true })
        .eq('user_id', user_id).eq('package_id', package_id)
        .in('status', ['pending', 'approved']);
      if (countError) throw countError;
      if (count >= terms.maxPurchases) {
        return res.status(409).json({
          success: false,
          error: `Purchase limit reached for ${terms.name} (${terms.maxPurchases} maximum)`,
        });
      }

      const { data, error } = await supabase.from('deposits').insert({
        user_id, package_id, package_name: terms.name || package_name, chicken_type,
        avg_weight: parseFloat(avg_weight) || 0,
        num_birds: parseInt(num_birds) || 0,
        rate: terms.deposit, total_return: terms.monthly,
        pay_method, transaction_ref, phone_used,
        status: 'pending'
      }).select().single();
      if (error) throw error;
      await supabase.from('transactions').insert({
        user_id, type: 'deposit', amount: terms.deposit,
        description: `Deposit: ${terms.name} - ${fmtKES(terms.deposit)}`,
        status: 'pending', reference_id: data.id
      });
      await supabase.from('notifications').insert({
        user_id, title: 'Deposit Submitted',
        message: `Your deposit of KSh ${fmtKES(terms.deposit)} for ${terms.name} has been submitted and is pending approval.`,
        read: false
      });
      return res.status(201).json({ success: true, data });
    }

    if (req.method === 'PUT') {
      const adminUser = await verifyAdmin(req);
      if (!adminUser) return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });

      const { id, status, admin_note } = req.body;
      if (!id || !status) return res.status(400).json({ success: false, error: 'id and status required' });
      if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, error: 'Status must be approved or rejected' });

      // Fetch the REAL transaction from DB - never trust client
      const { data: deposit, error: fetchErr } = await supabase.from('deposits').select('*').eq('id', id).single();
      if (fetchErr || !deposit) return res.status(404).json({ success: false, error: 'Deposit not found' });

      // DUPLICATE PREVENTION: Only pending transactions can be processed
      if (deposit.status !== 'pending') {
        return res.status(409).json({ success: false, error: `Transaction is already ${deposit.status} and cannot be changed` });
      }

      const now = new Date().toISOString();
      const updateData = {
        status,
        admin_note: admin_note || null,
        approved_by: adminUser.id,
        approved_at: now,
      };
      const { data, error } = await supabase.from('deposits').update(updateData).eq('id', id).select().single();
      if (error) throw error;

      if (status === 'approved') {
        // Calculate end date from package duration
        let endDate = new Date();
        endDate.setDate(endDate.getDate() + 40);
        try {
          const { data: pkgData } = await supabase.from('packages').select('description').eq('id', deposit.package_id).single();
          if (pkgData && pkgData.description) {
            const details = JSON.parse(pkgData.description);
            if (details.duration) endDate = new Date(Date.now() + details.duration * 24 * 60 * 60 * 1000);
          }
        } catch (e) {}

        // Create investment record
        const { data: investment } = await supabase.from('investments').insert({
          user_id: deposit.user_id, deposit_id: deposit.id,
          package_id: deposit.package_id, package_name: deposit.package_name,
          amount: deposit.total_return, returns: deposit.total_return,
          status: 'active', start_date: now,
          end_date: endDate.toISOString()
        }).select().single();

        // Create a claim record with 24-hour lock
        if (investment) {
          await supabase.from('claims').insert({
            investment_id: investment.id,
            user_id: deposit.user_id,
            package_name: deposit.package_name,
            amount: deposit.total_return,
            activated_at: now,
            status: 'locked',
          });
        }

        // Update transaction status
        await supabase.from('transactions').update({ status: 'completed' }).eq('reference_id', deposit.id).eq('type', 'deposit');

        // Notify user
        await supabase.from('notifications').insert({
          user_id: deposit.user_id, title: 'Deposit Approved',
          message: `Your deposit for ${deposit.package_name} has been approved! Your investment is now active. You can claim your returns after 24 hours.`,
          read: false
        });

        const packageTerms = getPackageTerms({ name: deposit.package_name });
        if (packageTerms?.referralBonus) {
          const { data: referral } = await supabase.from('referrals')
            .select('referrer_id').eq('referred_id', deposit.user_id).eq('level', 1).maybeSingle();
          if (referral) {
            const { data: existingBonus, error: bonusLookupError } = await supabase.from('transactions')
              .select('id').eq('reference_id', deposit.id).eq('type', 'referral_bonus').maybeSingle();
            if (bonusLookupError) throw bonusLookupError;
            if (!existingBonus) {
              const { error: bonusError } = await supabase.from('transactions').insert({
                user_id: referral.referrer_id,
                type: 'referral_bonus',
                amount: packageTerms.referralBonus,
                description: `Referral bonus: ${packageTerms.name}`,
                status: 'completed',
                reference_id: deposit.id,
              });
              if (bonusError) throw bonusError;
              await supabase.from('notifications').insert({
                user_id: referral.referrer_id,
                title: 'Referral Bonus Earned',
                message: `You earned KSh ${fmtKES(packageTerms.referralBonus)} from your referral's ${packageTerms.name} package.`,
                read: false,
              });
            }
          }
        }
      } else if (status === 'rejected') {
        // No wallet credit for rejected deposits
        await supabase.from('transactions').update({ status: 'failed' }).eq('reference_id', deposit.id).eq('type', 'deposit');
        await supabase.from('notifications').insert({
          user_id: deposit.user_id, title: 'Deposit Rejected',
          message: `Your deposit for ${deposit.package_name} has been rejected.${admin_note ? ` Reason: ${admin_note}` : ''}`,
          read: false
        });
      }

      return res.status(200).json({ success: true, message: `Deposit ${status} successfully`, data });
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (err) {
    console.error('API error [deposits]:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
