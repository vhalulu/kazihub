import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmMpesaPayment, activateSubscription } from '@/lib/mpesa/mpesa-confirm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Get pending retry jobs
    const { data: jobs } = await supabase
      .from('mpesa_retries')
      .select('*, transaction:transactions(*)')
      .eq('status', 'pending')
      .lte('next_retry_at', new Date().toISOString())
      .limit(10);

    console.log(`🔄 Processing ${jobs?.length || 0} retry jobs`);

    for (const job of jobs || []) {
      try {
        const confirmed = await confirmMpesaPayment(
          job.transaction_id,
          job.checkout_request_id
        );

        if (confirmed) {
          // Activate subscription if needed
          if (job.transaction?.transaction_type === 'subscription') {
            await activateSubscription(job.transaction);
          }

          // Mark retry as done
          await supabase
            .from('mpesa_retries')
            .update({ status: 'done' })
            .eq('id', job.id);

          console.log('✅ Retry job completed:', job.id);
        } else {
          const attempts = job.attempts + 1;
          const maxAttempts = 10;

          await supabase
            .from('mpesa_retries')
            .update({
              attempts,
              next_retry_at: new Date(Date.now() + 10000).toISOString(), // retry in 10s
              status: attempts >= maxAttempts ? 'failed' : 'pending',
            })
            .eq('id', job.id);
        }
      } catch (err) {
        console.error('Retry error for job:', job.id, err);
      }
    }

    return NextResponse.json({ processed: jobs?.length || 0 });
  } catch (error) {
    console.error('Retry route error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}