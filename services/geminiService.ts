import { GoogleGenAI, Type } from "@google/genai";
import { ProcessedData, DataRow, GeminiResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    headers: {
      type: Type.ARRAY,
      description: "An array of strings representing the column headers, in the correct order, based on the template spreadsheet.",
      items: { type: Type.STRING },
    },
    rows: {
      type: Type.ARRAY,
      description: "An array of arrays, where each inner array is a row of restructured data. The values in each row must correspond to the headers.",
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    transformationSummary: {
        type: Type.ARRAY,
        description: "A detailed log of the transformation process. Each string in the array should describe a specific action taken, such as column mapping, additions, or appends.",
        items: { type: Type.STRING },
    },
  },
  required: ["headers", "rows", "transformationSummary"],
};

export async function restructureSpreadsheet(sourceData: string, templateData: string): Promise<ProcessedData> {
  const prompt = `
    Persona: Act as an expert Data Transformation AI Engine. Your core purpose is to intelligently synchronize the structure of one spreadsheet (source) based on the schema of another (template). Your operations should be precise, data-preserving, and efficient.

    Mission: You will receive two spreadsheet files as CSV data. Your mission is to re-architect the source_spreadsheet to perfectly conform to the structure defined by the template_spreadsheet.

    Inputs:
    - source_spreadsheet: The file containing the original data in an outdated or incorrect structure.
    - template_spreadsheet: The file that serves as the "golden record" or master template. Its structure (column names, order) is the target state.

    Execution Protocol:
    1.  Schema Extraction: Analyze the template_spreadsheet to extract its definitive schema: a list of exact column headers and their precise order.
    2.  Source Analysis & Semantic Mapping: Analyze the source_spreadsheet. Create a mapping between the source columns and the template's schema using exact and fuzzy matching (e.g., map source 'Trans. ID' to template 'TransactionID').
    3.  Data Transformation & Restructuring:
        - Generate a new dataset based on the template's schema.
        - Populate the new dataset's columns with data from the source_spreadsheet according to the mapping.
        - For any columns defined in the template but not found in the source, create them as empty columns.
        - For any unmapped columns from the source, append them to the end of the new dataset, preserving their original header and data, to prevent data loss.

    Final Output:
    Produce a JSON object with three keys: "headers", "rows", and "transformationSummary".
    - "headers": An array of strings representing the final column titles, starting with the template columns in order, followed by any unmapped source columns.
    - "rows": An array of arrays, where each inner array represents a single row of transformed data. The number of items in each row array must exactly match the number of items in the headers array.
    - "transformationSummary": An array of human-readable strings detailing the changes made. For example: ["Mapped source column 'Old Name' to template column 'New Name'.", "Added missing template column 'Status'.", "Appended unmapped source column 'Legacy ID' to the end."]. This summary must be clear and concise.
    - Do not include any explanations, introductory text, or markdown formatting in your response. Only output the raw JSON that adheres to the provided schema.

    --- TEMPLATE SPREADSHEET (CSV) ---
    ${templateData}
    --- END TEMPLATE SPREADSHEET ---

    --- SOURCE SPREADSHEET (CSV) ---
    ${sourceData}
    --- END SOURCE SPREADSHEET ---
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

    if (!parsedResponse.headers || !parsedResponse.rows || !parsedResponse.transformationSummary) {
        throw new Error("Invalid response format from AI. Missing 'headers', 'rows', or 'transformationSummary'.");
    }

    const { headers, rows, transformationSummary } = parsedResponse;

    const data: DataRow[] = rows.map((row) => {
      const rowObject: DataRow = {};
      headers.forEach((header, index) => {
        rowObject[header] = row[index] || '';
      });
      return rowObject;
    });

    return { headers, data, transformationSummary };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("The AI returned an invalid JSON response. Please try again.");
    }
    throw new Error("Failed to restructure spreadsheet. The AI service may be unavailable or the request was invalid.");
  }
}