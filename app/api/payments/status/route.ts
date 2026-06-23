import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { queryStkPush } from '@/lib/mpesa/stk-push';

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 });
    }

    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('payer_id', user.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // If already completed or failed, return as is
    if (transaction.status === 'completed' || transaction.status === 'failed') {
      return NextResponse.json({ transaction });
    }

    // If pending and we have a CheckoutRequestID, query Safaricom directly
    if (transaction.status === 'pending' && transaction.mpesa_transaction_id) {
      try {
        const stkQuery = await queryStkPush(transaction.mpesa_transaction_id);
        console.log('STK Query response:', JSON.stringify(stkQuery));

        // ResultCode 0 means success
        if (stkQuery.ResultCode === '0' || stkQuery.ResultCode === 0) {
          // Payment confirmed! Update transaction and activate subscription
          await serviceSupabase
            .from('transactions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('id', transaction.id);

          // Handle subscription activation
          if (transaction.transaction_type === 'subscription') {
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setMonth(expiresAt.getMonth() + 1);

            await serviceSupabase.from('subscriptions').insert({
              user_id: transaction.payer_id,
              subscription_type: 'tasker_pro',
              billing_cycle: 'monthly',
              amount: transaction.total_amount,
              status: 'active',
              starts_at: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              next_billing_date: expiresAt.toISOString(),
            });

            await serviceSupabase
              .from('profiles')
              .update({ is_pro_tasker: true })
              .eq('id', transaction.payer_id);

            console.log('✅ Subscription activated via STK query for user:', transaction.payer_id);
          }

          return NextResponse.json({ 
            transaction: { ...transaction, status: 'completed' } 
          });
        }

        // ResultCode 1032 = cancelled by user
        if (stkQuery.ResultCode === '1032' || stkQuery.ResultCode === 1032) {
          await serviceSupabase
            .from('transactions')
            .update({ status: 'failed' })
            .eq('id', transaction.id);

          return NextResponse.json({ 
            transaction: { ...transaction, status: 'failed' } 
          });
        }

        // Still pending (ResultCode 1037 = timeout, keep polling)
        console.log('STK still pending, ResultCode:', stkQuery.ResultCode);

      } catch (queryError) {
        console.error('STK query error:', queryError);
        // Fall through and return pending status
      }
    }

    return NextResponse.json({ transaction });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}