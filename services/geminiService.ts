import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResponse } from "../types";

const apiKey = process.env.API_KEY || '';

export const analyzeColumnMapping = async (
  sourceHeaders: string[],
  targetHeaders: string[],
  sourcePreview: any[]
): Promise<AIAnalysisResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    I have a source spreadsheet and a target template. 
    I need to map the columns from the source to the target structure.

    Source Headers: ${JSON.stringify(sourceHeaders)}
    Target Headers: ${JSON.stringify(targetHeaders)}
    
    Source Data Preview (first 3 rows):
    ${JSON.stringify(sourcePreview.slice(0, 3))}

    Please analyze the semantic meaning of the headers and data to determine the best mapping.
    If a target column does not have a matching source column, set sourceHeader to null.
    
    Provide a brief summary of the restructuring process (e.g., "Mapped 'Email Address' to 'Contact Email' and ignored 'Timestamp'").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mappings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  targetHeader: { type: Type.STRING },
                  sourceHeader: { type: Type.STRING, nullable: true },
                  confidence: { type: Type.NUMBER },
                  reasoning: { type: Type.STRING },
                },
                required: ["targetHeader", "reasoning"],
              },
            },
            summary: { type: Type.STRING },
          },
          required: ["mappings", "summary"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text) as AIAnalysisResponse;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to analyze column mapping with AI.");
  }
};
