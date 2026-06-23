import { NextRequest, NextResponse } from 'next/server';
import { initiateStkPush } from '@/lib/mpesa/stk-push';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

// Service role client for DB writes - bypasses RLS
const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, amount, type } = await req.json();

    if (!phone || !amount || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const validTypes = ['subscription', 'verification', 'task_payment'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    const accountReference = `KAZIHUB-${type.toUpperCase()}-${user.id.slice(0, 8).toUpperCase()}`;
    const transactionDesc = type === 'subscription'
      ? 'KaziHub Pro Subscription'
      : type === 'verification'
      ? 'KaziHub Identity Verification'
      : 'KaziHub Task Payment';

    // Create pending transaction using service role to bypass RLS
    const { data: transaction, error: txError } = await serviceSupabase
      .from('transactions')
      .insert({
        payer_id: user.id,
        task_amount: amount,
        total_amount: amount,
        phone_number: phone,
        transaction_type: type,
        status: 'pending',
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction insert error:', txError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }

    // Initiate STK Push
    const stkResponse = await initiateStkPush({
      phone,
      amount,
      accountReference,
      transactionDesc,
    });

    console.log('STK Response:', JSON.stringify(stkResponse));

    if (stkResponse.ResponseCode !== '0') {
      await serviceSupabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: stkResponse.ResponseDescription },
        { status: 400 }
      );
    }

    // Save CheckoutRequestID using service role
    const { error: updateError } = await serviceSupabase
      .from('transactions')
      .update({ mpesa_transaction_id: stkResponse.CheckoutRequestID })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Failed to save CheckoutRequestID:', updateError);
    } else {
      console.log('✅ CheckoutRequestID saved:', stkResponse.CheckoutRequestID);
    }

    return NextResponse.json({
      success: true,
      message: stkResponse.CustomerMessage,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      transactionId: transaction.id,
    });

  } catch (error: any) {
    console.error('STK Push error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}