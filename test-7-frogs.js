const fetch = require('node-fetch');

// Test the improved image analysis with the 7 frogs image
async function test7FrogsAnalysis() {
  console.log('🐸 Testing 7 frogs image analysis...');
  
  // The 7 frogs image URL
  const testImageUrl = 'https://page.gensparksite.com/v1/base64_upload/b36e0b8cca614c56a53c2af3b235531a';
  
  try {
    console.log('📥 Downloading 7 frogs image...');
    const imageResponse = await fetch(testImageUrl);
    const imageBuffer = await imageResponse.buffer();
    const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    console.log('🔍 Sending to improved Gemini API...');
    
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
    
    console.log('\n📊 7 Frogs Analysis Results:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n🎯 Recognition Results:');
      console.log('🔤 Expression:', result.data.expression);
      console.log('📝 Problem:', result.data.problem);
      console.log('🔢 Numbers:', result.data.numbers);
      console.log('💡 Answer:', result.data.answer);
      console.log('🎯 Type:', result.data.type);
      
      console.log('\n📏 Expected vs Actual:');
      console.log('✅ Expected: 3 + 4 = 7 (7 frogs total)');
      console.log('🎲 Actual  :', result.data.expression, '=', result.data.answer);
      
      if (result.data.answer === 7) {
        console.log('🎉 SUCCESS! Correct count achieved!');
      } else {
        console.log('❌ Still incorrect. Need further improvement.');
      }
      
      if (result.data.visualElements) {
        console.log('\n🖼️ Visual Analysis:');
        console.log('   Objects:', result.data.visualElements.objects);
        console.log('   Count:', result.data.visualElements.count);
        console.log('   Arrangement:', result.data.visualElements.arrangement);
      }
      
    } else {
      console.log('\n❌ Analysis failed:');
      console.log('Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the 7 frogs test
console.log('🚀 Starting 7 Frogs Accuracy Test\n');
test7FrogsAnalysis().then(() => {
  console.log('\n🏁 7 Frogs test completed');
}).catch(console.error);