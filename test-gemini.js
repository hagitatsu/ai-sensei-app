// Test script to verify Gemini 2.0 API connection
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: API key not found');
    console.log('Please set GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable');
    return;
  }

  console.log('API key found');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Using Gemini 2.0 Flash Experimental model
    console.log('Connecting to Gemini 2.0 Flash Experimental model...');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    // Simple test prompt in English
    const prompt = 'Hello! Please briefly introduce yourself.';
    console.log('Test prompt:', prompt);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('Gemini 2.0 response:');
    console.log(text);
    console.log('\nSUCCESS: Gemini 2.0 Flash Experimental model is working!');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    
    if (error.message?.includes('403') || error.message?.includes('referer')) {
      console.log('\nHTTP Referrer Restriction Error');
      console.log('Solution:');
      console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/apis/credentials');
      console.log('2. Select your API key');
      console.log('3. Change "Application restrictions" to "None"');
      console.log('4. Save and wait a few minutes');
      console.log('\nServer-side calls do not send referrer headers, so this restriction does not work.');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.log('\nAPI quota limit reached');
      console.log('Free tier limit: 15 requests per minute');
      console.log('Please wait and try again later');
    } else if (error.message?.includes('model')) {
      console.log('\nModel Error');
      console.log('Please verify access to Gemini 2.0 Flash Experimental model');
    }
  }
}

// 環境変数を読み込んでテスト実行
require('dotenv').config({ path: '.env.local' });
testGemini();