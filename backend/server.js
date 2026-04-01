/* eslint-env node */
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const extractRoutes = require("./routes/extract");
const roaRoutes = require("./routes/roaRoutes");
const complianceRoutes = require("./routes/complianceRoutes");
const chatRoutes = require("./routes/chatRoutes");
const reviewFormRoutes = require("./routes/reviewFormRoutes");
const voiceUpdateRoutes = require("./routes/voiceUpdateRoutes");
const fixRecommendationRoutes = require("./routes/fixRecommendationRoutes");
const fixComplianceRoutes = require("./routes/fixComplianceRoutes");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) =>
  res.json({
    ok: true,
    hasApiKey: Boolean(process.env.ANTHROPIC_API_KEY),
  })
);
app.use("/extract", extractRoutes);
app.use("/generate-roa", roaRoutes);
app.use("/compliance-check", complianceRoutes);
app.use("/chat", chatRoutes);
app.use("/review-form", reviewFormRoutes);
app.use("/voice-update", voiceUpdateRoutes);
app.use("/fix-recommendation", fixRecommendationRoutes);
app.use("/fix-compliance", fixComplianceRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error." });
});

const server = app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("Warning: ANTHROPIC_API_KEY is missing. /extract and AI endpoints will fail.");
  }
});

server.on("close", () => {
  console.warn("Backend server closed.");
});

server.on("error", (error) => {
  console.error("Backend server error:", error.message);
});

process.stdin.resume();
