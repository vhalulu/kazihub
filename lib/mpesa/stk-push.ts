const MPESA_BASE_URL = 'https://api.safaricom.co.ke';

/**
 * Get OAuth token from Daraja
 */
export async function getMpesaToken(): Promise<string> {
  const consumer_key = process.env.MPESA_CONSUMER_KEY!;
  const consumer_secret = process.env.MPESA_CONSUMER_SECRET!;

  const auth = Buffer.from(
    `${consumer_key}:${consumer_secret}`
  ).toString('base64');

  const res = await fetch(
    `${MPESA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: 'GET',
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get MPesa token: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Generate password (base64 of shortcode + passkey + timestamp)
 */
export function getMpesaPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey = process.env.MPESA_PASSKEY!;
  return Buffer.from(
    `${shortcode}${passkey}${timestamp}`
  ).toString('base64');
}

/**
 * Format timestamp as YYYYMMDDHHmmss
 */
export function getMpesaTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[^0-9]/g, '')
    .slice(0, 14);
}

/**
 * Format phone number to 254XXXXXXXXX
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    return `254${cleaned.slice(1)}`;
  }

  if (cleaned.startsWith('254')) {
    return cleaned;
  }

  if (cleaned.startsWith('+')) {
    return cleaned.slice(1);
  }

  return cleaned;
}

export interface StkPushParams {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

/**
 * Initiate STK Push
 */
export async function initiateStkPush(
  params: StkPushParams
): Promise<StkPushResponse> {
  const token = await getMpesaToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);
  const phone = formatPhone(params.phone);

  const body = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: phone,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc,
  };

  console.log('🚀 STK Push body:', JSON.stringify(body, null, 2));

  const res = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const responseData = await res.json();

  console.log('📡 STK Push response:', responseData);

  if (!res.ok) {
    throw new Error(
      `STK Push failed: ${JSON.stringify(responseData)}`
    );
  }

  // Safety check (important fix)
  if (!responseData.CheckoutRequestID) {
    throw new Error(
      'Missing CheckoutRequestID from STK response'
    );
  }

  return responseData;
}

/**
 * Query STK Push status
 */
export async function queryStkPush(
  checkoutRequestId: string
) {
  const token = await getMpesaToken();
  const timestamp = getMpesaTimestamp();
  const password = getMpesaPassword(timestamp);

  const body = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    CheckoutRequestID: checkoutRequestId,
  };

  const res = await fetch(
    `${MPESA_BASE_URL}/mpesa/stkpushquery/v1/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  const data = await res.json();

  console.log('📡 STK Query response:', data);

  return data;
}
