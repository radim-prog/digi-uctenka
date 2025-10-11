const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyBqBcc2Wc9-dTv1bFLBIpMJUVCG-B_ZfP4';

  console.log('Testing Gemini API...');
  console.log('API Key:', apiKey.substring(0, 10) + '...');

  const genAI = new GoogleGenerativeAI(apiKey);

  // Zkusíme různé názvy modelů
  const modelsToTry = [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro-vision',
  ];

  for (const modelName of modelsToTry) {
    console.log(`\n--- Testing ${modelName} ---`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello, respond with just "OK"');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} WORKS! Response:`, text);
      break; // Našli jsme fungující model
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message);
    }
  }

  // Zkusíme získat seznam dostupných modelů
  console.log('\n--- Trying to list available models ---');
  try {
    // Toto může nebo nemusí fungovat podle API verze
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    const data = await response.json();

    if (data.models) {
      console.log('\n✅ Available models:');
      data.models.forEach(model => {
        console.log(`  - ${model.name} (${model.displayName})`);
      });
    } else {
      console.log('Could not list models:', data);
    }
  } catch (error) {
    console.log('Error listing models:', error.message);
  }
}

testGemini().catch(console.error);
