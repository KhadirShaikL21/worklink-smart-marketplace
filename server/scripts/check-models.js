import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from ../config/.env or just root .env. Only needed to get key.
dotenv.config({ path: path.join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("No GEMINI_API_KEY found in environment!");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
  console.log("Checking available models...");
  // The SDK doesn't expose listModels directly on genAI instance in all versions, 
  // but let's try to make a raw request if needed. 
  // Actually, older SDKs might not have it. 
  // But let's try a direct fetch to the API endpoint using standard fetch to be sure.
  
  try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const resp = await fetch(url);
      const data = await resp.json();
      
      if (data.models) {
          console.log("\n--- Available Models for GenerateContent ---");
          const chatModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
          chatModels.forEach(m => {
              console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`);
          });
          console.log("\n-------------------------------------------");
      } else {
          console.log("No models found or error structure:", data);
      }
  } catch (err) {
      console.error("Error listing models:", err);
  }
}

listModels();
