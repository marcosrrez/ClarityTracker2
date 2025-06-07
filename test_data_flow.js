// Data Flow Verification Test for AI Collaboration System
// Tests the complete pipeline: Azure Video → Azure Speech → Google AI → SOAP Notes

const testDataFlow = async () => {
  console.log('🔍 Testing AI Collaboration Data Flow...\n');

  // Test 1: Video Analysis Pipeline
  console.log('1. Testing Video Analysis (Azure Computer Vision)');
  try {
    const videoResponse = await fetch('http://localhost:5000/api/session-intelligence/analyze-video-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 pixel test
        timestamp: Date.now()
      })
    });
    
    const videoData = await videoResponse.json();
    console.log('   ✓ Video analysis response:', videoData.success ? 'SUCCESS' : 'FAILED');
    console.log('   ✓ Data structure:', Object.keys(videoData.data || videoData));
  } catch (error) {
    console.log('   ✗ Video analysis failed:', error.message);
  }

  // Test 2: Speech Transcription Analysis
  console.log('\n2. Testing Speech Transcription Analysis');
  try {
    const speechResponse = await fetch('http://localhost:5000/api/session-intelligence/analyze-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I have been feeling anxious lately and having trouble sleeping.',
        timestamp: Date.now()
      })
    });
    
    const speechData = await speechResponse.json();
    console.log('   ✓ Speech analysis response:', speechData.success ? 'SUCCESS' : 'FAILED');
    console.log('   ✓ Clinical themes:', speechData.data?.clinicalThemes || speechData.clinicalThemes || 'Not found');
  } catch (error) {
    console.log('   ✗ Speech analysis failed:', error.message);
  }

  // Test 3: Google AI Clinical Insights
  console.log('\n3. Testing Google AI Clinical Insights Generation');
  try {
    const insightsResponse = await fetch('http://localhost:5000/api/session-intelligence/generate-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const insightsData = await insightsResponse.json();
    console.log('   ✓ Insights generation response:', insightsData.success ? 'SUCCESS' : 'FAILED');
    console.log('   ✓ Insights count:', insightsData.insights?.length || 'Not found');
  } catch (error) {
    console.log('   ✗ Insights generation failed:', error.message);
  }

  // Test 4: SOAP Note Generation (Google AI)
  console.log('\n4. Testing SOAP Note Generation (Google AI)');
  try {
    const soapResponse = await fetch('http://localhost:5000/api/session-intelligence/generate-soap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcription: [
          {
            text: 'I have been feeling anxious lately and having trouble sleeping.',
            speaker: 'Client',
            timestamp: Date.now(),
            clinicalTags: ['anxiety', 'sleep-disorder'],
            emotionalTone: 'concerned'
          }
        ],
        videoAnalysis: [
          {
            timestamp: Date.now(),
            dominantEmotion: 'anxiety',
            emotionConfidence: 0.8,
            engagementScore: 75,
            detectedFaces: 1
          }
        ],
        clinicalInsights: [
          {
            type: 'therapeutic-alliance',
            content: 'Client showing good engagement',
            confidence: 0.9,
            timestamp: Date.now()
          }
        ],
        sessionDuration: 1800
      })
    });
    
    const soapData = await soapResponse.json();
    console.log('   ✓ SOAP generation response:', soapData.success ? 'SUCCESS' : 'FAILED');
    console.log('   ✓ SOAP structure:', Object.keys(soapData.data || soapData));
  } catch (error) {
    console.log('   ✗ SOAP generation failed:', error.message);
  }

  // Test 5: API Status Check
  console.log('\n5. Testing AI Integration Status');
  try {
    const statusResponse = await fetch('/api/ai/integration-status');
    const statusData = await statusResponse.json();
    console.log('   ✓ Azure Computer Vision:', statusData.azureVision?.status || 'Unknown');
    console.log('   ✓ Azure Speech:', statusData.azureSpeech?.status || 'Unknown');
    console.log('   ✓ Google AI:', statusData.googleAI?.status || 'Unknown');
  } catch (error) {
    console.log('   ✗ Status check failed:', error.message);
  }

  console.log('\n📊 Data Flow Test Complete');
};

// Run the test
testDataFlow().catch(console.error);