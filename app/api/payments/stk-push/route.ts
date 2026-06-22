import { NextRequest, NextResponse } from 'next/server';
import { initiateStkPush } from '@/lib/mpesa/stk-push';
import { createClient } from '@/lib/supabase/server';

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

    // Valid payment types
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

    // Create a pending transaction record
    const { data: transaction, error: txError } = await supabase
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

    if (stkResponse.ResponseCode !== '0') {
      // Update transaction as failed
      await supabase
        .from('transactions')
        .update({ status: 'failed' })
        .eq('id', transaction.id);

      return NextResponse.json(
        { error: stkResponse.ResponseDescription },
        { status: 400 }
      );
    }

    // Store the CheckoutRequestID so we can match the callback
    await supabase
      .from('transactions')
      .update({ mpesa_transaction_id: stkResponse.CheckoutRequestID })
      .eq('id', transaction.id);

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