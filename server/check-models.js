import { GoogleGenerativeAI } from "@google/generative-ai";
import env from './config/env.js';

async function listModels() {
    if (!env || !env.geminiApiKey) {
        console.error('No Gemini API key found in env.js');
        process.exit(1);
    }
    
    console.log(`Checking models for key: ${env.geminiApiKey.substring(0, 5)}...`);
    const genAI = new GoogleGenerativeAI(env.geminiApiKey);
    try {
        // Unfortunately standard JS SDK (0.24.1) doesn't have a direct 'listModels' on the main client object easily accessible in docs
        // But usually it's genAI.getGenerativeModel({ model: ... })
        // Let's try to just use a known good model and print result
        
        // Actually, there is no public listModels() in @google/generative-ai Node SDK yet?
        // Wait, the error message literally says "Call ListModels"
        // It might be referring to the REST API, not the SDK method.
        
        // Let's try to list models using REST API via fetch, just to be sure
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${env.geminiApiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log('Available Models:', data.models.map(m => m.name));
        } else {
            console.error('Error fetching models:', data);
        }
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
