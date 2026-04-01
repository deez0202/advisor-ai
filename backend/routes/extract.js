/* eslint-env node */
const express = require("express");
const { extractStructuredData } = require("../services/extractService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { transcript } = req.body || {};
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ error: "Transcript is required." });
    }

    console.log("[/extract] Incoming transcript:", transcript.slice(0, 500));

    const structuredData = await extractStructuredData(transcript);
    console.log("[/extract] AI structured response:", JSON.stringify(structuredData));

    return res.json(structuredData);
  } catch (error) {
    console.error("[/extract] Extraction failed:", error.message);
    return res.status(500).json({
      error: `Failed to extract structured data: ${error.message}`,
    });
  }
});

module.exports = router;
