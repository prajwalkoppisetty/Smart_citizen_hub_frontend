import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey: apiKey,
  });
} else {
  console.warn("VITE_GEMINI_API_KEY is not defined. AI features will be disabled.");
}

const MODEL_CANDIDATES = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3.1-pro",
  "gemini-2.5-flash",
  "gemini-2.5-pro"
];

/**
 * Sends base64 image data and complaint description to Gemini
 * to automatically detect the category, summarize the issue, and estimate severity.
 * 
 * @param {string} imageBase64 Base64 string of the image (without standard data URI prefix)
 * @param {string} description Text description of the complaint
 * @returns {Promise<{category: string, summary: string, severity: string, confidence: number}>}
 */
export const analyzeComplaint = async (imageBase64, description) => {
  if (!aiClient) {
    throw new Error("Gemini AI client is not initialized. Please verify your VITE_GEMINI_API_KEY.");
  }

  let lastError = null;

  for (const modelName of MODEL_CANDIDATES) {
    try {
      console.log(`[AI Analysis] Attempting analysis using model: ${modelName}`);
      const response = await aiClient.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: imageBase64,
            },
          },
          {
            text: `
You are an AI civic complaint classifier.

Available categories:
1. Road & Infrastructure
2. Water & Sanitation
3. Garbage & Waste
4. Electricity & Lighting
5. Others / Public Health

Analyze the provided image and description.
Description: "${description || 'No description provided.'}"

You must determine the following:
- title: A short, professional, and formal 4-8 word title for the complaint (e.g., 'Overflowing Public Garbage Bin' or 'Dangerous Pothole on Roadway').
- summary: A very brief, one-sentence description summarizing the issue (e.g., 'Broken streetlight on 5th avenue causing dark roadway hazards').
- description: A clean, grammatically correct, formal, and detailed paragraph describing the issue. Synthesize both what is visible in the image and what the user wrote in their description.
- category: Must be exactly one of the five categories listed above.
- severity: Must be exactly 'Low', 'Medium', or 'High'.
- confidence: An integer between 0 and 100 representing your confidence level.

Return ONLY a raw JSON object matching the schema below. Do not wrap it in markdown code blocks, do not add comments, and do not add any extra text.

{
 "title": "formal title",
 "summary": "brief summary line",
 "description": "detailed formal description",
 "category": "category name",
 "severity": "severity rating",
 "confidence": 95
}
`,
          },
        ],
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response received from Gemini API");
      }

      // Clean up markdown block wrapping if present
      const cleanedText = responseText.trim().replace(/^```json\s*|```\s*$/gi, '');
      const parsedData = JSON.parse(cleanedText);
      
      console.log(`[AI Analysis] Success using model: ${modelName}`, parsedData);
      return parsedData;
    } catch (error) {
      console.warn(`[AI Analysis] Model ${modelName} failed, attempting next candidate. Error:`, error.message || error);
      lastError = error;
      continue;
    }
  }

  console.error("All Gemini model candidates failed.");
  throw lastError || new Error("All Gemini AI model candidates failed.");
};
