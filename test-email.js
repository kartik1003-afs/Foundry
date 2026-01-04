const emailService = require('./server/services/emailService');

async function testEmailService() {
  console.log('Testing email service configuration...');
  
  try {
    const isReady = await emailService.testConnection();
    
    if (isReady) {
      console.log('✅ Email service is configured correctly');
      
      // Test with sample data
      const sampleLostItem = {
        itemType: 'wallet',
        description: 'Black leather wallet with silver cards',
        location: 'Library - 2nd floor',
        dateLost: new Date('2024-01-01'),
        contactInfo: 'test-lost@example.com',
        imageUrl: 'https://example.com/wallet.jpg'
      };
      
      const sampleFoundItem = {
        itemType: 'wallet',
        description: 'Black leather wallet found near study area',
        location: 'Library - 2nd floor',
        dateFound: new Date('2024-01-02'),
        contactInfo: 'test-found@example.com',
        imageUrl: 'https://example.com/wallet-found.jpg'
      };
      
      console.log('Sending test email notification...');
      const emailSent = await emailService.sendMatchNotification(
        sampleLostItem,
        sampleFoundItem,
        0.85
      );
      
      if (emailSent) {
        console.log('✅ Test email notification sent successfully');
        console.log('📧 Check test-lost@example.com and test-found@example.com');
      } else {
        console.log('❌ Failed to send test email');
      }
      
    } else {
      console.log('❌ Email service configuration failed');
      console.log('Please check your environment variables:');
      console.log('- EMAIL_SERVICE');
      console.log('- EMAIL_USER');
      console.log('- EMAIL_PASS');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testEmailService();
