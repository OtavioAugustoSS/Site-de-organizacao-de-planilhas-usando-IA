
import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedData, DataRow, GeminiResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    headers: {
      type: Type.ARRAY,
      description: "An array of strings representing the column headers, in the correct order.",
      items: { type: Type.STRING },
    },
    rows: {
      type: Type.ARRAY,
      description: "An array of arrays, where each inner array is a row of data. The values in each row must correspond to the headers.",
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  },
  required: ["headers", "rows"],
};

export async function restructureSpreadsheet(fileName: string, targetStructure: string): Promise<ProcessedData> {
  const prompt = `
    You are an expert data transformation engine. A user has provided a source spreadsheet named '${fileName}' and needs to restructure it.
    
    The user-defined target structure is:
    "${targetStructure}"

    Your task is to generate a plausible sample dataset of 10 rows that perfectly matches this target structure. 
    - The output must be a JSON object with two keys: "headers" and "rows".
    - "headers" must be an array of strings representing the column titles.
    - "rows" must be an array of arrays, where each inner array represents a single row of data.
    - The number of items in each row array must exactly match the number of items in the headers array.
    - Do not include any explanations, introductory text, or markdown formatting in your response. Only output the raw JSON.
    - Generate realistic but synthetic data.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      }
    });

    const jsonText = response.text.trim();
    const parsedResponse: GeminiResponse = JSON.parse(jsonText);

    if (!parsedResponse.headers || !parsedResponse.rows) {
        throw new Error("Invalid response format from AI. Missing 'headers' or 'rows'.");
    }

    const { headers, rows } = parsedResponse;

    const data: DataRow[] = rows.map((row) => {
      const rowObject: DataRow = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index] || '';
      });
      return rowObject;
    });

    return { headers, data };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to restructure spreadsheet. The AI service may be unavailable or the request was invalid.");
  }
}
