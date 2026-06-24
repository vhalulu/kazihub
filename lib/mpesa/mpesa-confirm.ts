import { queryStkPush } from '@/lib/mpesa/stk-push';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function confirmMpesaPayment(transactionId: string, checkoutRequestId: string) {
  const query = await queryStkPush(checkoutRequestId);

  console.log('📡 STK QUERY RESPONSE:', JSON.stringify(query, null, 2));

  if (query.ResultCode !== '0') {
    console.log('❌ Payment not successful yet');
    return;
  }

  // Extract receipt safely
  const receipt = query.MpesaReceiptNumber || query.ReceiptNumber;

  const amount = query.Amount;
  const phone = query.PhoneNumber;

  const { error } = await supabase
    .from('transactions')
    .update({
      mpesa_receipt_number: receipt,
      status: 'completed',
      phone_number: phone ? String(phone) : null,
      completed_at: new Date().toISOString(),
    })
    .eq('id', transactionId);

  if (error) {
    console.error('❌ Failed to update after STK query:', error);
  } else {
    console.log('✅ Payment fully confirmed with receipt');
  }
}