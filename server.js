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

// AI-1 Formatter Endpoint
app.post('/api/notes/format', async (req, res) => {
    try {
        const { patientName, rawNotes } = req.body;
        
        if (!rawNotes) {
            return res.status(400).json({ error: "Missing rawNotes" });
        }
        
        // Pass data through AI-1 (The Formatter)
        const formattedNotes = await formatPatientData(rawNotes);
        
        res.status(200).json({
            patientName,
            formatted: formattedNotes
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
