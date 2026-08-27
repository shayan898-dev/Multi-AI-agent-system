import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI-1 (The Formatter)
 * Formats raw patient data into a concise, professional summary without altering facts.
 * 
 * @param {string} rawNotes - The raw patient notes entered by the doctor.
 * @returns {Promise<string>} The formatted notes ready for the next agent.
 */
export async function formatPatientData(rawNotes) {
    if (!rawNotes || typeof rawNotes !== 'string') {
        throw new Error("Invalid input: rawNotes must be a non-empty string.");
    }

    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable.");
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Strict Configuration for AI-1
        const model = genAI.getGenerativeModel({
            model: "gemini-3.6-flash", 
            systemInstruction: "You are a medical data formatter. Organize the following raw notes into a concise, professional summary. Do NOT add, infer, or alter any factual information or diagnoses.",
            generationConfig: {
                temperature: 0.0, // Strictly 0.0 to ensure deterministic behavior and prevent hallucinations with sensitive data
            }
        });

        // Execute the LLM call
        const result = await model.generateContent(rawNotes);
        const formattedResponse = result.response.text();
        
        return formattedResponse;
        
    } catch (error) {
        console.error("[AI-1 Formatter] Error processing patient data:", error);
        throw new Error("Failed to format patient data via AI-1.");
    }
}
