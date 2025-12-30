// production-test-real-sms.js
// This sends REAL SMS to actual phone numbers
// Run with: node production-test-real-sms.js

const africastalking = require('africastalking')({
  apiKey: 'atsk_272871a967bc6add4312aeb374e7e1d62c69ec254faf8b5034c5ab7580a2e8b440f37f58',
  username: 'TangleAdmin'  // ← CHANGED FROM 'sandbox' to YOUR ACTUAL USERNAME
});

const sms = africastalking.SMS;

// Real Safaricom number to test
const phoneNumber = '+254735471402';

console.log('🚀 PRODUCTION MODE - Sending REAL SMS');
console.log('📱 Target:', phoneNumber);
console.log('👤 Username: TangleAdmin');
console.log('⏳ Sending...\n');

sms.send({
  to: [phoneNumber],
  message: 'Hello! Your KaziHub verification code is: 123456. This is a REAL test message.',
  from: 'TangleApp'  // Your sender ID
})
.then(response => {
  console.log('✅ ✅ ✅ SUCCESS! REAL SMS SENT! ✅ ✅ ✅\n');
  console.log('📊 Full Response:');
  console.log(JSON.stringify(response, null, 2));
  
  if (response.SMSMessageData && response.SMSMessageData.Recipients) {
    const recipients = response.SMSMessageData.Recipients;
    console.log('\n📬 Delivery Status:');
    recipients.forEach(recipient => {
      console.log(`  📱 Number: ${recipient.number}`);
      console.log(`  ✅ Status: ${recipient.status}`);
      console.log(`  💰 Cost: ${recipient.cost}`);
      console.log(`  🆔 MessageId: ${recipient.messageId}`);
    });
  }
  
  console.log('\n✉️  CHECK YOUR PHONE NOW!');
  console.log('The person should receive a REAL SMS message!');
})
.catch(error => {
  console.error('❌ ERROR SENDING SMS!\n');
  console.error('Error:', error.message || error);
  
  if (error.toString().includes('Insufficient')) {
    console.error('\n💰 INSUFFICIENT BALANCE!');
    console.error('Action: Top up your Africa\'s Talking account');
    console.error('Go to: https://account.africastalking.com/apps/billing');
  } else if (error.toString().includes('Invalid credentials')) {
    console.error('\n🔑 CREDENTIALS ERROR!');
    console.error('Check:');
    console.error('1. Username should be "TangleAdmin" (not "sandbox")');
    console.error('2. API key should be production key');
    console.error('3. Get production key from dashboard');
  } else {
    console.error('\n📋 Full Error:');
    console.error(error);
  }
});
