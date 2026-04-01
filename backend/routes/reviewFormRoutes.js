/* eslint-env node */
const express = require("express");
const { reviewFormData } = require("../services/reviewService");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { formData } = req.body || {};
    if (!formData || typeof formData !== "object") {
      return res.status(400).json({ error: "formData is required." });
    }

    const review = await reviewFormData(formData);
    return res.json({ review });
  } catch (error) {
    return res.status(500).json({
      error: `Failed to review form: ${error.message}`,
    });
  }
});

module.exports = router;
