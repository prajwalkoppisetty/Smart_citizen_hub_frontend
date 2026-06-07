import api from './api';

/**
 * Sends base64 image data and complaint description to the backend proxy
 * which securely forwards the request to Google Gemini API.
 * 
 * @param {string} imageBase64 Base64 string of the image (without standard data URI prefix)
 * @param {string} description Text description of the complaint
 * @returns {Promise<{category: string, summary: string, description: string, severity: string, confidence: number}>}
 */
export const analyzeComplaint = async (imageBase64, description) => {
  try {
    const response = await api.post('/complaints/analyze', {
      imageBase64,
      description
    });

    if (response.data && response.data.success && response.data.analysis) {
      return response.data.analysis;
    } else {
      throw new Error(response.data?.message || "Invalid AI analysis response from server");
    }
  } catch (error) {
    console.error("[AI Service] Analysis failed:", error);
    throw new Error(error.response?.data?.message || error.message || "Failed to analyze complaint");
  }
};
