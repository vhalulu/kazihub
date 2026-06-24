import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { queryStkPush } from '@/lib/mpesa/stk-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log('🔔 MPesa Callback:', JSON.stringify(body, null, 2));

    const stkCallback = body?.Body?.stkCallback;
    const CheckoutRequestID = stkCallback?.CheckoutRequestID;
    const ResultCode = stkCallback?.ResultCode;

    if (!CheckoutRequestID) {
      return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    // 1. Find transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_transaction_id', CheckoutRequestID)
      .single();

    if (!transaction) {
      console.log('❌ Transaction not found');
      return NextResponse.json({ ResultCode: 0 });
    }

    // 2. Mark as processing
    await supabase
      .from('transactions')
      .update({
        status: 'processing',
        completed_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    // 3. IMMEDIATE STK QUERY
    const query = await queryStkPush(CheckoutRequestID);

    const resultParams =
      query?.Result?.ResultParameters?.ResultParameter || [];

    const get = (key: string) =>
      resultParams.find((i: any) => i.Key === key)?.Value;

    const receipt = get('MpesaReceiptNumber');

    if (receipt) {
      // SUCCESS CASE
      await supabase
        .from('transactions')
        .update({
          status: 'completed',
          mpesa_receipt_number: receipt,
        })
        .eq('id', transaction.id);

      console.log('✅ Payment completed:', receipt);

      return NextResponse.json({ ResultCode: 0 });
    }

    // 4. IF NO RECEIPT → ADD TO RETRY QUEUE
    await supabase.from('mpesa_retries').insert({
      checkout_request_id: CheckoutRequestID,
      transaction_id: transaction.id,
      attempts: 1,
      next_retry_at: new Date(Date.now() + 5000).toISOString(),
      status: 'pending',
    });

    console.log('⚠️ Added to retry queue');

    return NextResponse.json({ ResultCode: 0 });
  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.json({ ResultCode: 0 });
  }
}