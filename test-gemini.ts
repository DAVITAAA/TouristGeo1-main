import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    console.log('Testing Gemini API...');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say hello world',
    });
    console.log('Success:', response.text);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
