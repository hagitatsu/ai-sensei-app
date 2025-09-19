#!/usr/bin/env node

/**
 * 様々なカウント問題のテストスクリプト
 */

const https = require('https');
const fs = require('fs');

// さまざまなカウント画像のURLを定義
const testCases = [
  {
    name: "7匹のかえる",
    url: "https://i.imgur.com/sJ8GU4R.jpg", // 7匹のかえる
    expected: { total: 7, left: 3, right: 4 }
  },
  {
    name: "6匹想定（Pixabayから）", 
    url: "https://cdn.pixabay.com/photo/2018/07/12/07/41/frog-3532203_960_720.jpg",
    expected: { total: 6 } // 推定
  }
];

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

async function testImageAnalysis(imageData, testName) {
  try {
    console.log(`\n🧪 Testing: ${testName}`);
    console.log('📤 Sending to Gemini API...');
    
    const response = await fetch('http://localhost:3000/api/vision/gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Analysis Results:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success && result.data) {
      console.log('\n🎯 Recognition Results:');
      console.log('🔤 Expression:', result.data.expression);
      console.log('🔢 Numbers:', result.data.numbers);
      console.log('💡 Answer:', result.data.answer);
      console.log('🎯 Type:', result.data.type);
      
      if (result.data.visualElements) {
        console.log('\n🖼️ Visual Analysis:');
        console.log('   Objects:', result.data.visualElements.objects);
        console.log('   Count:', result.data.visualElements.count);
        console.log('   Arrangement:', result.data.visualElements.arrangement);
      }
    } else {
      console.log('❌ Error:', result.error || 'Unknown error');
      console.log('📝 Details:', result.details || 'No details');
      if (result.demo) {
        console.log('⚠️ Demo mode detected!');
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('🚫 Test failed:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Various Count Tests');
  
  // ローカル開発サーバーを起動してからテストするかチェック
  try {
    const healthResponse = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!healthResponse) {
      console.log('⚠️ ローカルサーバーが起動していません。先にnpm run devを実行してください。');
      return;
    }
  } catch (error) {
    // 健全性チェックAPIがない場合は続行
  }
  
  for (const testCase of testCases) {
    try {
      console.log(`\n📥 Downloading: ${testCase.name}...`);
      const imageData = await downloadImage(testCase.url);
      await testImageAnalysis(imageData, testCase.name);
      
      // API レート制限を避けるための待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to test ${testCase.name}:`, error.message);
    }
  }
  
  console.log('\n🏁 All tests completed');
}

// テスト実行
runTests().catch(console.error);