import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Safaricom validation - respond to GET requests
export async function GET(req: NextRequest) {
  console.log('🔔 Safaricom validation GET request received');
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('🔔 MPesa callback received:', JSON.stringify(body, null, 2));

    const { Body } = body;
    const { stkCallback } = Body;
    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = stkCallback;

    console.log('CheckoutRequestID:', CheckoutRequestID, 'ResultCode:', ResultCode);

    // Find the transaction
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
      const items = CallbackMetadata?.Item || [];
      const getMeta = (name: string) => items.find((i: any) => i.Name === name)?.Value;

      const mpesaReceiptNumber = getMeta('MpesaReceiptNumber');
      const paidAmount = parseFloat(getMeta('Amount') || '0');
      const phoneNumber = getMeta('PhoneNumber');

      console.log('✅ Real MPesa receipt received:', mpesaReceiptNumber);

      // Update transaction with REAL receipt number from callback
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: mpesaReceiptNumber, // Real receipt like UFN8H8Z4V2
          phone_number: String(phoneNumber),
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      // Mark retry job as done if exists
      await supabase
        .from('mpesa_retries')
        .update({ status: 'done' })
        .eq('checkout_request_id', CheckoutRequestID);

      // Handle subscription
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

        await supabase
          .from('profiles')
          .update({ is_pro_tasker: true })
          .eq('id', transaction.payer_id);

        console.log('✅ Subscription activated via callback for user:', transaction.payer_id);
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
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      await supabase
        .from('mpesa_retries')
        .update({ status: 'failed' })
        .eq('checkout_request_id', CheckoutRequestID);

      console.log(`Payment failed: ${ResultDesc}`);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  } catch (error) {
    console.error('MPesa callback error:', error);
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}