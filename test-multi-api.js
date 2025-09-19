#!/usr/bin/env node

/**
 * マルチAPI画像認識システムのテストスクリプト
 */

const https = require('https');

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const data = [];
      response.on('data', chunk => data.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(data);
        const base64 = buffer.toString('base64');
        resolve(`data:image/jpeg;base64,${base64}`);
      });
    }).on('error', reject);
  });
}

async function testMultiAPI() {
  console.log('🚀 Starting Multi-API Vision Test');
  console.log('📝 Testing with 7 frogs image (Expected: 3 + 4 = 7)');
  
  try {
    // 7匹のかえる画像をダウンロード
    console.log('📥 Downloading test image...');
    const imageData = await downloadImage('https://i.imgur.com/sJ8GU4R.jpg');
    
    console.log('🔄 Calling Multi-API endpoint...');
    const response = await fetch('http://localhost:3000/api/vision/multi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData
      })
    });
    
    const result = await response.json();
    
    console.log('\n📊 Multi-API Results:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n🎯 Analysis Results:');
      console.log('🔤 Expression:', result.data.expression);
      console.log('🔢 Numbers:', result.data.numbers);
      console.log('💡 Answer:', result.data.answer);
      console.log('🎯 Type:', result.data.type);
      
      console.log('\n📋 Problem-Specific Hints:');
      result.data.suggestedHints?.forEach((hint, i) => {
        console.log(`   ${i + 1}. ${hint}`);
      });
      
      if (result.meta) {
        console.log('\n🔍 Multi-API Metadata:');
        console.log('   Primary Model:', result.primary);
        console.log('   Confidence:', result.meta.confidence);
        console.log('   Consensus:', result.meta.consensus);
        console.log('   Successful APIs:', result.meta.successfulAPIs, '/', result.meta.totalAPIs);
        
        console.log('\n🤖 All API Results:');
        result.meta.allResults?.forEach(apiResult => {
          console.log(`   ${apiResult.model}: ${apiResult.answer} (conf: ${apiResult.confidence})`);
        });
      }
      
      console.log('\n📏 Accuracy Check:');
      const expected = 7;
      const actual = result.data.answer;
      if (actual === expected) {
        console.log('✅ SUCCESS! Correct count achieved!');
      } else {
        console.log(`❌ FAILED! Expected: ${expected}, Got: ${actual}`);
      }
      
    } else {
      console.log('❌ Error:', result.error || 'Unknown error');
      console.log('📝 Details:', result.details || 'No details');
      
      if (result.results) {
        console.log('\n🤖 Individual API Results:');
        result.results.forEach(apiResult => {
          console.log(`   ${apiResult.model}: ${apiResult.success ? 'SUCCESS' : 'FAILED'}`);
          if (apiResult.error) console.log(`     Error: ${apiResult.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('🚫 Test failed:', error.message);
  }
  
  console.log('\n🏁 Multi-API test completed');
}

// テスト実行
testMultiAPI().catch(console.error);