/* eslint-env node */
const express = require("express");
const { extractStructuredData } = require("../services/extractService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "Transcript is required." });
    }

    const structuredData = await extractStructuredData(transcript);
    return res.json(structuredData);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to extract structured data.",
      detail: error.message,
    });
  }
});

module.exports = router;
