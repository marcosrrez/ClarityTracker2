import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';
const sampleTranscript = "I've been feeling really anxious lately, especially about work. I keep thinking I'm not good enough and that everyone will find out I'm a fraud.";

console.log('🧪 Testing SOAP Note Generation Fix...\n');

// Test with sessionData format (how our test was sending it)
async function testSOAPWithSessionData() {
  console.log('1. Testing with sessionData object format...');
  try {
    const response = await fetch(`${baseUrl}/api/session-intelligence/generate-soap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionData: {
          transcript: sampleTranscript,
          duration: 3000, // 50 minutes in seconds
          interventions: ['cognitive restructuring'],
          themes: ['anxiety', 'imposter syndrome']
        }
      })
    });

    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) {
      console.log('   Error:', data.error);
    } else {
      console.log('   SOAP generated:', !!data.soapNote || !!data.data?.soapNote);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
}

// Test with direct transcription array format
async function testSOAPWithTranscriptionArray() {
  console.log('\n2. Testing with transcription array format...');
  try {
    const response = await fetch(`${baseUrl}/api/session-intelligence/generate-soap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription: [
          {
            text: sampleTranscript,
            speaker: 'Client',
            timestamp: Date.now()
          }
        ],
        sessionDuration: 3000,
        clinicalInsights: [
          {
            type: 'anxiety',
            content: 'Client expressing work-related anxiety patterns'
          }
        ]
      })
    });

    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) {
      console.log('   Error:', data.error);
    } else {
      console.log('   SOAP generated:', !!data.soapNote || !!data.data?.soapNote);
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
}

// Test with string transcription format
async function testSOAPWithStringTranscription() {
  console.log('\n3. Testing with string transcription format...');
  try {
    const response = await fetch(`${baseUrl}/api/session-intelligence/generate-soap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription: sampleTranscript,
        sessionDuration: 3000,
        clinicalInsights: ['anxiety patterns detected']
      })
    });

    const data = await response.json();
    console.log('   Status:', response.status);
    console.log('   Response:', response.ok ? 'SUCCESS' : 'FAILED');
    if (!response.ok) {
      console.log('   Error:', data.error);
    } else {
      console.log('   SOAP generated:', !!data.soapNote || !!data.data?.soapNote);
      if (data.soapNote || data.data?.soapNote) {
        const soap = data.soapNote || data.data.soapNote;
        console.log('   Subjective preview:', soap.subjective?.substring(0, 50) + '...');
      }
    }
  } catch (error) {
    console.log('   Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testSOAPWithSessionData();
  await testSOAPWithTranscriptionArray();
  await testSOAPWithStringTranscription();
  
  console.log('\n🔍 SOAP Generation Test Complete');
}

runTests().catch(console.error);