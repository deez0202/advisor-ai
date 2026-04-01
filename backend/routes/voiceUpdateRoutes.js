/* eslint-env node */
const express = require("express");
const { voiceUpdateForm } = require("../services/voiceUpdateService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { transcript, formData } = req.body || {};
    if (!transcript || !String(transcript).trim()) {
      return res.status(400).json({ error: "transcript is required." });
    }
    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ error: "formData is required." });
    }

    console.log("Transcript:", String(transcript).slice(0, 400));
    console.log("FormData:", JSON.stringify(formData));

    if (process.env.VOICE_UPDATE_TEST_MODE === "true") {
      return res.json({
        clientDetails: { name: "Test Voice" },
        needs: { riskProfile: "High" },
      });
    }

    const updates = await voiceUpdateForm({
      transcript: String(transcript).trim(),
      formData,
    });

    console.log("[/voice-update] AI updates:", JSON.stringify(updates));

    return res.json(updates);
  } catch (error) {
    console.error("[/voice-update] failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
