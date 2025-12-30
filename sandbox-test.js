// sandbox-test.js
// This tests your integration works (won't send real SMS)
// Run with: node sandbox-test.js

const africastalking = require('africastalking')({
  apiKey: 'atsk_272871a967bc6add4312aeb374e7e1d62c69ec254faf8b5034c5ab7580a2e8b440f37f58',
  username: 'sandbox'  // ← Back to sandbox to test integration
});

const sms = africastalking.SMS;

const phoneNumber = '+254735471402';

console.log('🧪 SANDBOX MODE - Testing API Integration');
console.log('⚠️  This will NOT send real SMS');
console.log('📱 Target:', phoneNumber);
console.log('⏳ Sending...\n');

sms.send({
  to: [phoneNumber],
  message: 'Test: Your KaziHub verification code is: 123456',
})
.then(response => {
  console.log('✅ API INTEGRATION WORKS!');
  console.log('✅ Code is correct');
  console.log('⚠️  But this did NOT send real SMS (sandbox mode)\n');
  console.log('📊 Response:');
  console.log(JSON.stringify(response, null, 2));
  console.log('\n📧 EMAIL PAULINE/ABUBAKAR:');
  console.log('Tell them: "My integration works in sandbox. How do I go live?"');
})
.catch(error => {
  console.error('❌ ERROR!');
  console.error(error.message || error);
});
