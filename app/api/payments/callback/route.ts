import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmMpesaPayment } from '@/lib/mpesa-confirm';

// Service role client (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  console.log('🔔 MPesa validation GET received');
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log(
      '🔔 MPesa callback received:',
      JSON.stringify(body, null, 2)
    );

    const { Body } = body;
    const { stkCallback } = Body;

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
    } = stkCallback;

    console.log(
      '📌 CheckoutRequestID:',
      CheckoutRequestID,
      'ResultCode:',
      ResultCode
    );

    // Find transaction
    const { data: transaction, error: findError } = await supabase
      .from('transactions')
      .select('*')
      .eq('mpesa_transaction_id', CheckoutRequestID)
      .single();

    if (findError || !transaction) {
      console.error(
        '❌ Transaction not found:',
        CheckoutRequestID,
        findError
      );

      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: 'Accepted',
      });
    }

    console.log('✅ Transaction found:', transaction.id);

    // SUCCESS CALLBACK
    if (ResultCode === 0) {
      // Mark as completed (WITHOUT receipt)
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (updateError) {
        console.error('❌ Update error:', updateError);
      } else {
        console.log('✅ Transaction marked completed');
      }

      // Trigger STK Query in background (source of truth for receipt)
      setTimeout(() => {
        confirmMpesaPayment(transaction.id, CheckoutRequestID);
      }, 5000);
    }

    // FAILED CALLBACK
    else {
      const { error: failError } = await supabase
        .from('transactions')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', transaction.id);

      if (failError) {
        console.error('❌ Failed update error:', failError);
      } else {
        console.log('❌ Transaction marked failed');
      }
    }

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  } catch (error) {
    console.error('❌ Callback error:', error);

    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: 'Accepted',
    });
  }
}
