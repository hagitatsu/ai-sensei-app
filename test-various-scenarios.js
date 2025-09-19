#!/usr/bin/env node

/**
 * 様々なシナリオでのGemini改善版テストスクリプト
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

async function testImageAnalysis(imageUrl, testName, expected) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('📥 Downloading image...');
  
  try {
    const imageData = await downloadImage(imageUrl);
    
    console.log('🔄 Analyzing with enhanced Gemini...');
    const response = await fetch('http://localhost:3000/api/vision/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
    
    const result = await response.json();
    
    if (result.success && result.data) {
      console.log('🎯 Results:');
      console.log('   Expression:', result.data.expression);
      console.log('   Numbers:', result.data.numbers);
      console.log('   Answer:', result.data.answer);
      
      // 精度チェック
      const isAccurate = result.data.answer === expected.total
      console.log(`📊 Accuracy: ${isAccurate ? '✅ CORRECT' : '❌ INCORRECT'}`);
      console.log(`   Expected: ${expected.total}, Got: ${result.data.answer}`);
      
      // ヒントの質チェック
      const hints = result.data.suggestedHints || []
      const hasSpecificHints = hints.some(h => h.length > 20 && !h.includes('一緒に') && !h.includes('がんばって'))
      console.log(`💡 Hint Quality: ${hasSpecificHints ? '✅ SPECIFIC' : '⚠️ GENERIC'}`);
      
      return { accurate: isAccurate, hasQualityHints: hasSpecificHints }
      
    } else {
      console.log('❌ Analysis failed:', result.error || 'Unknown error');
      return { accurate: false, hasQualityHints: false }
    }
    
  } catch (error) {
    console.error('🚫 Test failed:', error.message);
    return { accurate: false, hasQualityHints: false }
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Gemini Enhancement Tests\n');
  
  const testCases = [
    {
      name: "7匹のかえる (3+4)",
      url: "https://i.imgur.com/sJ8GU4R.jpg",
      expected: { total: 7, left: 3, right: 4 }
    },
    {
      name: "簡単な数え問題 (5個以下)",
      url: "https://cdn.pixabay.com/photo/2017/02/15/13/40/tulips-2069723_960_720.jpg",
      expected: { total: 5 } // 推定
    },
    {
      name: "対称的配置",
      url: "https://cdn.pixabay.com/photo/2018/04/18/13/47/ducks-3331516_960_720.jpg", 
      expected: { total: 6 } // 推定
    }
  ];
  
  let totalTests = 0;
  let accurateTests = 0;
  let qualityHintTests = 0;
  
  for (const testCase of testCases) {
    const result = await testImageAnalysis(testCase.url, testCase.name, testCase.expected);
    totalTests++;
    if (result.accurate) accurateTests++;
    if (result.hasQualityHints) qualityHintTests++;
    
    // API制限回避のため待機
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 FINAL RESULTS:');
  console.log(`🎯 Accuracy: ${accurateTests}/${totalTests} (${Math.round(accurateTests/totalTests*100)}%)`);
  console.log(`💡 Quality Hints: ${qualityHintTests}/${totalTests} (${Math.round(qualityHintTests/totalTests*100)}%)`);
  
  if (accurateTests === totalTests && qualityHintTests === totalTests) {
    console.log('\n🎉 SUCCESS! Gemini改善版は完璧に動作しています！');
    console.log('   Claude APIは不要です - 現在のシステムで十分です');
  } else if (accurateTests >= totalTests * 0.8) {
    console.log('\n⚡ GOOD! Gemini改善版は良好です');
    console.log('   さらなる改善またはClaude API併用を検討');
  } else {
    console.log('\n⚠️ NEEDS IMPROVEMENT');
    console.log('   Claude APIの導入を強く推奨します');
  }
  
  console.log('\n🏁 Comprehensive tests completed');
}

runComprehensiveTests().catch(console.error);