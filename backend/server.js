const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ai_content_db')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Schema (க'generatedText' and 'content')
const contentSchema = new mongoose.Schema({
  title: String,
  generatedText: String,
  content: String, 
  status: String,
  createdAt: { type: Date, default: Date.now }
});
const ContentModel = mongoose.model('contents', contentSchema);

// Gemini AI Setup
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate', async (req, res) => {
  const { title, prompt, language } = req.body;
  try {
    const formattingInstruction = "Structure the entire output strictly using numbers like 1, 2, 3 or simple points. Do NOT use markdown bold stars, asterisks, or hashtags anywhere.";

    let finalPrompt = "";
    if (language === 'ta') {
      finalPrompt = "Write the response completely in Tamil language (தமிழ்). " + formattingInstruction + " Content request: " + prompt;
    } else {
      finalPrompt = prompt + ". " + formattingInstruction;
    }

    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" }); 
    const result = await model.generateContent(finalPrompt);
    const textOutput = result.response.text();

    const newContent = new ContentModel({
      title: title || 'Untitled Automation',
      generatedText: textOutput,
      content: textOutput,
      status: 'Generated'
    });
    await newContent.save();

    res.json({ generatedText: textOutput });
  } catch (error) {
    console.error("CRITICAL ERROR LOG:", error);
    res.status(500).json({ error: error.message });
  }
});

// 1. API (FIXED SAVE)
app.post('/api/save', async (req, res) => {
  const { title, generatedText, status } = req.body;
  try {
    const savedLog = new ContentModel({ 
      title: title || 'Untitled', 
      generatedText: generatedText,
      content: generatedText, 
      status: status || 'Draft' 
    });
    await savedLog.save();
    res.json({ message: "Success" });
  } catch (error) {
    console.error("Save Endpoint Error:", error);
    res.status(500).json({ error: "Failed to save data." });
  }
});

// 2. API (FIXED DELETE)
app.delete('/api/history/:id', async (req, res) => {
  try {
    const removeId = req.params.id;
    await ContentModel.findByIdAndDelete(removeId);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("Delete Endpoint Error:", error);
    res.status(500).json({ error: "Failed to delete log." });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    const dataLogs = await ContentModel.find().sort({ createdAt: -1 });
    res.json(dataLogs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs." });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));