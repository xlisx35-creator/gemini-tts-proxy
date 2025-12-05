import express from "express";

const app = express();
app.use(express.json({ limit: "50mb" }));

const apiKeys = (process.env.GEMINI_API_KEYS || "")
  .split(",")
  .map(k => k.trim())
  .filter(Boolean);

if (!apiKeys.length) {
  console.error("No GEMINI_API_KEYS provided");
}

async function callGeminiWithKey(apiKey, payload) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await r.json().catch(() => ({}));
  return { response: r, data };
}

app.post("/tts", async (req, res) => {
  try {
    const payload = req.body;

    if (!apiKeys.length) {
      return res.status(500).json({ error: "No API keys configured" });
    }

    let lastError = null;

    for (const key of apiKeys) {
      const { response, data } = await callGeminiWithKey(key, payload);

      // Успех
      if (response.ok) {
        return res.status(200).json(data);
      }

      // Квота / 429 — пробуем следующий ключ
      const status = response.status;
      const errStatus = data?.error?.status;
      if (status === 429 || errStatus === "RESOURCE_EXHAUSTED") {
        lastError = data;
        continue;
      }

      // Любая другая ошибка — отдаём сразу
      return res.status(status).json(data);
    }

    // Если все ключи кончились по квоте
    return res.status(429).json({
      error: "All API keys exhausted",
      lastError,
    });
  } catch (e) {
    return res.status(500).json({ error: e.toString() });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("TTS proxy running on port", PORT);
});
