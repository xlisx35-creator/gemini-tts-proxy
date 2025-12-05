import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));

app.post("/tts", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const payload = req.body;

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await r.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("TTS proxy running on port", PORT);
});
