/* eslint-env node */
const express = require("express");
const { generateRoaFromStructuredData } = require("../services/roaService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { structuredData, refinementHint } = req.body;
    if (!structuredData || typeof structuredData !== "object") {
      return res.status(400).json({ error: "structuredData is required." });
    }

    const roaText = await generateRoaFromStructuredData(structuredData, refinementHint);
    return res.json({ roaText });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to generate ROA.",
      detail: error.message,
    });
  }
});

module.exports = router;
