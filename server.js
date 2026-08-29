import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Allow requests from frontend
app.use(express.json()); // Parse incoming JSON requests

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'Server is running normally.' });
});

// Chatbot Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;

        // Basic validation
        if (!message) {
            return res.status(400).json({ 
                error: "Bad Request", 
                reply: "Please provide a message." 
            });
        }

        // Ensure API key is configured
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
            console.error("Missing or invalid GEMINI_API_KEY environment variable.");
            return res.status(500).json({ 
                error: "Server Configuration Error", 
                reply: "The chatbot is currently unavailable because the API key is not configured. Please try again later." 
            });
        }

        // Initialize Gemini API client
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // We use gemini-3.6-flash as per the API's requirements for new users
        const model = genAI.getGenerativeModel({ 
            model: "gemini-3.6-flash",
            systemInstruction: "You are a helpful and professional virtual assistant for Dr. Jane Smith, a board-certified Internal Medicine physician. You help answer basic questions and direct patients. Do not give medical diagnoses."
        });

        // Call Gemini API
        const result = await model.generateContent(message);
        const llmResponse = result.response.text();
        
        res.status(200).json({ 
            reply: llmResponse 
        });

    } catch (error) {
        console.error("Error communicating with LLM:", error.message || error);
        
        // Generic fallback error
        res.status(500).json({ 
            error: "Internal Server Error", 
            reply: "An unexpected error occurred. Please try again later." 
        });
    }
});

import { formatPatientData } from './ai-formatter.js';

/**
 * AI-2 (The Authority Reviewer)
 * Evaluates the report strictly against medical data rules.
 * 
 * @param {string} reportData - The formatted notes from AI-1
 * @returns {Promise<string>} "APPROVED" or a specific allegation.
 */
async function evaluateWithAI2(reportData) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
        systemInstruction: 'You are a medical data auditor. Review the provided patient report. You must reject the report if it lacks standard vital signs, contains ambiguous dates, or is missing a clear diagnosis code. If it passes, reply ONLY with "APPROVED". If it fails, reply ONLY with a specific, single-sentence allegation (e.g., "Missing patient vital signs").',
        generationConfig: {
            temperature: 0.0, // Deterministic evaluation
        }
    });

    const result = await model.generateContent(reportData);
    // Remove any extra whitespace/newlines from the LLM response
    return result.response.text().trim();
}

/**
 * The Correction Loop Orchestrator
 * Handles the back-and-forth between AI-1 and AI-2.
 * 
 * @param {string} initialData - The initially formatted data from AI-1
 * @returns {Promise<Object>} An object containing success status and data or error
 */
async function processSubmission(initialData) {
    let currentData = initialData;
    let attempts = 0;
    const MAX_RETRIES = 3; // Critical Safety Measure
    
    // Helper function to pause execution (useful for rate limits)
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    while (attempts < MAX_RETRIES) {
        attempts++;
        console.log(`\n[Orchestrator] AI-2 Audit Attempt: ${attempts}`);

        try {
            // Send data to AI-2 for strict validation
            const ai2Response = await evaluateWithAI2(currentData);
            console.log(`[AI-2 Verdict]: ${ai2Response}`);

            if (ai2Response === "APPROVED") {
                console.log('[Orchestrator] Report officially APPROVED.');
                return { success: true, data: currentData };
            } else {
                // Rejection received
                const allegation = ai2Response;

                if (attempts < MAX_RETRIES) {
                    // Trigger AI-1 Correction Loop
                    console.log(`[Orchestrator] Triggering Correction Loop... Sending allegation back to AI-1.`);
                    const correctionPrompt = `The authority rejected the submission with this error: ${allegation}. Please correct the following data to resolve the issue: ${currentData}`;
                    
                    // Route back to AI-1 to fix the data
                    currentData = await formatPatientData(correctionPrompt);
                    console.log(`[AI-1 Revised Data Generated]`);
                }
            }
        } catch (error) {
            console.error(`[Orchestrator] Error during AI-2 evaluation: ${error.message}`);
            
            if (attempts < MAX_RETRIES) {
                console.log('[Orchestrator] Waiting 8 seconds before retrying to respect API rate limits...');
                await delay(8000); // Wait 8 seconds before the next loop iteration
            }
        }
    }

    // Max retries hit
    console.error('[Orchestrator] Loop terminated. Max retries reached.');
    return {
        success: false,
        error: "Submission failed after 3 attempts. Manual review required by the doctor."
    };
}

// AI-1 Formatter Endpoint (Updated with AI-2 integration)
app.post('/api/notes/format', async (req, res) => {
    try {
        const { patientName, rawNotes } = req.body;
        
        if (!rawNotes) {
            return res.status(400).json({ error: "Missing rawNotes" });
        }
        
        // 1. Pass data through AI-1 (The Formatter)
        const formattedNotes = await formatPatientData(rawNotes);
        
        // 2. Pass to AI-2 (The Orchestrator) for submission & correction loop
        const submissionResult = await processSubmission(formattedNotes);
        
        if (submissionResult.success) {
            res.status(200).json({
                patientName,
                formatted: submissionResult.data
            });
        } else {
            res.status(400).json({
                patientName,
                error: submissionResult.error
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Mock Authority Endpoint (Dummy Receiver)
app.post('/api/submit-to-authority', (req, res) => {
    // 1. Receive Data (we parse it to ensure it was sent, even if we just randomize the outcome)
    const { formattedData } = req.body;

    // 2. Simulate Outcomes (Randomizer: 50% chance to accept/reject)
    const isAccepted = Math.random() >= 0.5;

    if (isAccepted) {
        // 3. Success Response
        return res.status(200).json({ 
            status: "success", 
            message: "Authority accepted the data." 
        });
    } else {
        // 4. Rejection Response (The Allegation)
        const mockAllegations = [
            'Missing patient vital signs',
            'Improper date formatting',
            'Diagnosis code is unclear',
            'Incomplete medication history provided'
        ];
        
        // Randomly select one string from the predefined array
        const randomAllegation = mockAllegations[Math.floor(Math.random() * mockAllegations.length)];

        return res.status(400).json({ 
            status: "rejected", 
            allegation: randomAllegation 
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
