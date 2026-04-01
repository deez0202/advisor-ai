/* eslint-env node */
const express = require("express");
const { fixComplianceText } = require("../services/refineRoaService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { roaText } = req.body;
    if (!roaText || !String(roaText).trim()) {
      return res.status(400).json({ error: "roaText is required." });
    }

    const text = await fixComplianceText(String(roaText));
    return res.json({ roaText: text });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fix compliance.",
      detail: error.message,
    });
  }
});

module.exports = router;
