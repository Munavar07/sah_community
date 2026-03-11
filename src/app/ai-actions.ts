"use server";

import { GoogleGenAI } from "@google/genai";

// Initialize the Google Gen AI client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractProfitAmount(prevState: any, formData: FormData) {
    try {
        const file = formData.get("proof") as File;

        if (!file || file.size === 0) {
            return {
                success: false,
                amount: 0,
                message: "No screenshot provided for AI to analyze."
            };
        }

        // Convert the uploaded file to a format Gemini can understand (base64)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString("base64");

        const prompt = `
            Analyze this screenshot of a trading dashboard. 
            There are several transaction rows. 
            
            Look at the right side of each row. You will see text like "Direction: inflow", and directly below that, an amount in USD (e.g., "1.40", "0.03", "0.11", etc.).
            
            1. Find every single inflow amount shown across all the rows in this screenshot.
            2. Add all of these numbers together to get a total sum.
            
            Return ONLY a valid JSON object with a single key "total" containing the numerical sum. Do not include markdown formatting or any other text.
            Example: {"total": 1.65}
        `;

        // Call the Gemini model
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: file.type || "image/png",
                                data: base64Data
                            }
                        }
                    ]
                }
            ],
            config: {
                temperature: 0.1, // Low temperature for more deterministic/factual output
                responseMimeType: "application/json",
            }
        });

        const responseText = response.text || "{}";

        try {
            const parsedData = JSON.parse(responseText.trim());
            const total = parsedData.total;

            if (typeof total === 'number' && !isNaN(total)) {
                return {
                    success: true,
                    amount: total,
                    message: "Profit successfully calculated by AI."
                };
            } else {
                return {
                    success: false,
                    amount: 0,
                    message: "AI could not determine a valid total amount."
                };
            }

        } catch (parseError) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return {
                success: false,
                amount: 0,
                message: "AI returned an invalid format."
            };
        }

    } catch (error: any) {
        console.error("AI Extraction Error:", error);
        return {
            success: false,
            amount: 0,
            message: error.message || "Failed to communicate with AI service."
        };
    }
}
