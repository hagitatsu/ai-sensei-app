const fetch = require('node-fetch');
const fs = require('fs');

// Test the improved image analysis API
async function testImageAnalysis() {
  console.log('🧪 Testing improved image analysis API...');
  
  // Test with a sample image (the frog counting problem from the screenshot)
  // This is a base64 representation of a simple test image
  const testImageUrl = 'https://page.gensparksite.com/v1/base64_upload/4966b63ef1edd66b9349d18aadf40a20';
  
  try {
    console.log('📥 Downloading test image...');
    const imageResponse = await fetch(testImageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    console.log('🔍 Sending image to Gemini API endpoint...');
    
    // Test the local API endpoint
    const response = await fetch('http://localhost:3000/api/vision/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: base64Image 
      }),
    });
    
    const result = await response.json();
    
    console.log('\n📊 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n✅ Image Analysis Results:');
      console.log('🔤 Expression:', result.data.expression);
      console.log('📝 Problem:', result.data.problem);
      console.log('🔢 Numbers:', result.data.numbers);
      console.log('💡 Answer:', result.data.answer);
      console.log('📚 Concepts:', result.data.concepts);
      console.log('🎯 Type:', result.data.type);
      
      if (result.data.visualElements) {
        console.log('\n🖼️ Visual Elements:');
        console.log('   Objects:', result.data.visualElements.objects);
        console.log('   Count:', result.data.visualElements.count);
        console.log('   Arrangement:', result.data.visualElements.arrangement);
      }
      
      console.log('\n💡 Suggested Hints:');
      result.data.suggestedHints?.forEach((hint, index) => {
        console.log(`   ${index + 1}. ${hint}`);
      });
      
      if (result.model) {
        console.log('\n🤖 Model used:', result.model);
      }
      
      if (result.demo) {
        console.log('\n⚠️ Note: Running in demo mode');
      }
      
    } else {
      console.log('\n❌ Analysis failed:');
      console.log('Error:', result.error);
      console.log('Details:', result.details);
      console.log('Suggestion:', result.suggestion);
      
      if (result.isReferrerError) {
        console.log('\n🔧 This appears to be a referrer restriction error.');
        console.log('Please check the Google Cloud Console API key settings.');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
console.log('🚀 Starting AI Teacher Image Analysis Test\n');
testImageAnalysis().then(() => {
  console.log('\n🏁 Test completed');
}).catch(console.error);