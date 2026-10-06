import { randomBytes } from 'node:crypto';

export async function ensureReferralCode(supabase, userId) {
  const { data: existing, error: lookupError } = await supabase
    .from('referral_codes').select('code').eq('user_id', userId).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) return existing.code;

  for (let attempt = 0; attempt < 10; attempt++) {
    const code = `SN${randomBytes(8).toString('hex').toUpperCase()}`;
    const { data: duplicate, error: duplicateError } = await supabase
      .from('referral_codes').select('id').eq('code', code).maybeSingle();
    if (duplicateError) throw duplicateError;
    if (duplicate) continue;

    const { data: inserted, error: insertError } = await supabase
      .from('referral_codes').insert({ user_id: userId, code }).select('code').single();
    if (!insertError) return inserted.code;
    if (insertError.code !== '23505') throw insertError;

    const { data: concurrentlyCreated, error: concurrentError } = await supabase
      .from('referral_codes').select('code').eq('user_id', userId).maybeSingle();
    if (concurrentError) throw concurrentError;
    if (concurrentlyCreated) return concurrentlyCreated.code;
  }

  throw new Error('Could not create a unique referral code');
}