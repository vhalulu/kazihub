import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log('🧪 Test endpoint hit:', JSON.stringify(body));
  return NextResponse.json({ success: true, received: body });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ success: true, message: 'Test endpoint working' });
}