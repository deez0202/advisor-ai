/* eslint-env node */
const express = require("express");
const { callAnthropic } = require("../services/aiService");

const router = express.Router();

const CHAT_SYSTEM_PROMPT = "You are an expert ROA editor. Improve clarity, compliance tone, and actionable advisory wording while preserving factual accuracy.";

router.post("/", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "messages array is required." });
    }

    const reply = await callAnthropic({
      system: CHAT_SYSTEM_PROMPT,
      maxTokens: 1500,
      messages,
    });

    return res.json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to process chat request.",
      detail: error.message,
    });
  }
});

module.exports = router;
