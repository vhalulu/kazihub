import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    console.log('MPesa callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    // Find the transaction by CheckoutRequestID
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_transaction_id', CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error('Transaction not found for CheckoutRequestID:', CheckoutRequestID);
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Payment successful - extract metadata
      const items = CallbackMetadata?.Item || [];
      const getMeta = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptNumber = getMeta('MpesaReceiptNumber');
      const paidAmount = parseFloat(getMeta('Amount') || '0');
      const phoneNumber = getMeta('PhoneNumber');

      // ✅ Validate amount - reject if less than expected
      if (paidAmount < transaction.total_amount) {
        console.error(`Amount mismatch: expected ${transaction.total_amount}, got ${paidAmount}`);
        await supabase
          .from('transactions')
          .update({ 
            status: 'failed',
            mpesa_receipt_number: mpesaReceiptNumber,
            phone_number: String(phoneNumber),
            completed_at: new Date().toISOString(),
          })
          .eq('id', transaction.id);

        // Always return success to Safaricom even on amount mismatch
        return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
      }

      // Update transaction as completed
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber,
          phone_number: String(phoneNumber),
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // Handle post-payment logic based on transaction type
      if (transaction.transaction_type === 'subscription') {
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await supabase.from('subscriptions').insert({
          user_id: transaction.payer_id,
          subscription_type: 'tasker_pro',
          billing_cycle: 'monthly',
          amount: transaction.total_amount,
          status: 'active',
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          next_billing_date: expiresAt.toISOString(),
        });

        // Mark profile as pro tasker
        await supabase
          .from('profiles')
          .update({ is_pro_tasker: true })
          .eq('id', transaction.payer_id);
      }

      if (transaction.transaction_type === 'verification') {
        await supabase.from('user_verifications').upsert({
          user_id: transaction.payer_id,
          verification_type: 'id_verified',
          status: 'pending',
          payment_transaction_id: transaction.id,
        }, { onConflict: 'user_id,verification_type' });
      }

    } else {
      // Payment failed or cancelled
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      console.log(`Payment failed for transaction ${transaction.id}: ${ResultDesc}`);
    }

    // Always return success to Safaricom
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('MPesa callback error:', error);
    // Still return 200 to Safaricom so they don't retry
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}