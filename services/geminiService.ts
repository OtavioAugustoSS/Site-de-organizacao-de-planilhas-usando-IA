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

export async function restructureSpreadsheet(sourceData: string, targetStructure: string): Promise<ProcessedData> {
  const prompt = `
    You are an expert data transformation engine. A user has provided a source spreadsheet and needs to restructure it to match a target model.

    The source data is provided below in CSV format:
    --- SOURCE DATA ---
    ${sourceData}
    --- END SOURCE DATA ---
    
    The user-defined target structure is:
    "${targetStructure}"

    Your task is to analyze the source data and transform it to perfectly match the target structure. 
    - Restructure, reorder, and reformat the data from the source file to precisely match the target model's layout.
    - If a column in the target structure does not have a clear mapping from the source data, leave its values blank.
    - If the source data seems to contain more columns than needed, only include the ones that map to the target structure.
    - The output must be a JSON object with two keys: "headers" and "rows".
    - "headers" must be an array of strings representing the column titles from the target structure.
    - "rows" must be an array of arrays, where each inner array represents a single row of transformed data.
    - The number of items in each row array must exactly match the number of items in the headers array.
    - Do not include any explanations, introductory text, or markdown formatting in your response. Only output the raw JSON.
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