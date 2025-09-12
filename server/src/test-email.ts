import { sendTaskAcceptedEmailToUser, sendTaskAcceptedEmailToVolunteer } from './utils/emailUtils';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test the email functions
async function testEmails() {
  console.log('Testing task acceptance email notifications...');
  
  try {
    // Test email to user (task owner)
    console.log('Sending test email to user...');
    const userEmailResult = await sendTaskAcceptedEmailToUser(
      'test-user@example.com',
      'John Doe',
      'Help with grocery shopping',
      'Need someone to help me with grocery shopping for my elderly parents. The task involves picking up groceries from the local supermarket and delivering them to their home.',
      'Jane Smith',
      'test-volunteer@example.com',
      'test-task-123'
    );
    console.log('User email result:', userEmailResult);

    // Test email to volunteer
    console.log('Sending test email to volunteer...');
    const volunteerEmailResult = await sendTaskAcceptedEmailToVolunteer(
      'test-volunteer@example.com',
      'Jane Smith',
      'Help with grocery shopping',
      'Need someone to help me with grocery shopping for my elderly parents. The task involves picking up groceries from the local supermarket and delivering them to their home.',
      'John Doe',
      'test-user@example.com',
      '123 Main St, Anytown, AT 12345',
      150.00,
      'test-task-123'
    );
    console.log('Volunteer email result:', volunteerEmailResult);

    if (userEmailResult && volunteerEmailResult) {
      console.log('✅ Both emails sent successfully!');
    } else {
      console.log('❌ One or both emails failed to send');
    }
  } catch (error) {
    console.error('❌ Error testing emails:', error);
  }
}

// Run the test
testEmails();