/* eslint-env node */
const express = require("express");
const { runComplianceCheck } = require("../services/complianceService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { roaText } = req.body;
    if (!roaText || !roaText.trim()) {
      return res.status(400).json({ error: "roaText is required." });
    }

    const report = await runComplianceCheck(roaText);
    return res.json(report);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to run compliance check.",
      detail: error.message,
    });
  }
});

module.exports = router;
