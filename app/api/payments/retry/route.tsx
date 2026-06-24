import { createClient } from '@supabase/supabase-js';
import { queryStkPush } from '@/lib/mpesa/stk-push';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { data: jobs } = await supabase
    .from('mpesa_retries')
    .select('*')
    .eq('status', 'pending')
    .lte('next_retry_at', new Date().toISOString());

  for (const job of jobs || []) {
    try {
      const result = await queryStkPush(job.checkout_request_id);

      const params =
        result?.Result?.ResultParameters?.ResultParameter || [];

      const get = (key: string) =>
        params.find((i: any) => i.Key === key)?.Value;

      const receipt = get('MpesaReceiptNumber');

      if (receipt) {
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            mpesa_receipt_number: receipt,
          })
          .eq('id', job.transaction_id);

        await supabase
          .from('mpesa_retries')
          .update({ status: 'done' })
          .eq('id', job.id);
      } else {
        const attempts = job.attempts + 1;

        await supabase
          .from('mpesa_retries')
          .update({
            attempts,
            next_retry_at: new Date(Date.now() + 5000).toISOString(),
            status: attempts >= 5 ? 'failed' : 'pending',
          })
          .eq('id', job.id);
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
  }

  return new Response('OK');
}