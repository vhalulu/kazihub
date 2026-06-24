import { queryStkPush } from '@/lib/mpesa/stk-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function confirmMpesaPayment(transactionId: string, checkoutRequestId: string) {
  const query = await queryStkPush(checkoutRequestId);

  console.log('📡 STK QUERY RESPONSE:', JSON.stringify(query, null, 2));

  if (query.ResultCode !== '0' && query.ResultCode !== 0) {
    console.log('❌ Payment not confirmed yet, ResultCode:', query.ResultCode);
    return false;
  }

  // STK Query doesn't return receipt — use CheckoutRequestID as reference
  // Real receipt will come from callback when Safaricom fixes it
  const receiptRef = checkoutRequestId;

  const { error } = await supabase
    .from('transactions')
    .update({
      mpesa_receipt_number: receiptRef,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (error) {
    console.error('❌ Failed to update transaction:', error);
    return false;
  }

  console.log('✅ Payment confirmed, receipt ref:', receiptRef);
  return true;
}

export async function activateSubscription(transaction: any) {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  const { error: subError } = await supabase.from('subscriptions').insert({
    user_id: transaction.payer_id,
    subscription_type: 'tasker_pro',
    billing_cycle: 'monthly',
    amount: transaction.total_amount,
    status: 'active',
    starts_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    next_billing_date: expiresAt.toISOString(),
  });

  if (subError) {
    console.error('❌ Subscription insert error:', subError);
    return false;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ is_pro_tasker: true })
    .eq('id', transaction.payer_id);

  if (profileError) {
    console.error('❌ Profile update error:', profileError);
    return false;
  }

  console.log('✅ Subscription activated for user:', transaction.payer_id);
  return true;
}