import { createClient } from '@supabase/supabase-js';

const MPESA_BASE_URL = 'https://api.safaricom.co.ke';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getMpesaToken(): Promise<string> {
  const consumer_key = process.env.MPESA_CONSUMER_KEY!;
  const consumer_secret = process.env.MPESA_CONSUMER_SECRET!;
  const auth = Buffer.from(`${consumer_key}:${consumer_secret}`).toString('base64');

  const res = await fetch(`${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: { Authorization: `Basic ${auth}` },
  });

  const data = await res.json();
  return data.access_token;
}

export async function queryTransactionStatus(mpesaReceiptNumber: string): Promise<any> {
  const token = await getMpesaToken();

  const body = {
    Initiator: process.env.MPESA_INITIATOR_NAME,
    SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
    CommandID: 'TransactionStatusQuery',
    TransactionID: mpesaReceiptNumber,
    PartyA: process.env.MPESA_SHORTCODE,
    IdentifierType: '4', // Organization shortcode
    ResultURL: `${process.env.MPESA_CALLBACK_URL}/transaction-status`,
    QueueTimeOutURL: `${process.env.MPESA_CALLBACK_URL}/transaction-status`,
    Remarks: 'Transaction Status Query',
    Occasion: 'KaziHub Payment',
  };

  console.log('🔍 Transaction Status Query:', JSON.stringify(body, null, 2));

  const res = await fetch(`${MPESA_BASE_URL}/mpesa/transactionstatus/v1/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log('📡 Transaction Status Response:', JSON.stringify(data, null, 2));
  return data;
}

export async function updateTransactionReceipt(transactionId: string, receiptNumber: string) {
  const { error } = await supabase
    .from('transactions')
    .update({ mpesa_receipt_number: receiptNumber })
    .eq('id', transactionId)
    .eq('status', 'completed');

  if (error) {
    console.error('Failed to update receipt:', error);
    return false;
  }

  console.log('✅ Real receipt saved:', receiptNumber, 'for transaction:', transactionId);
  return true;
}