const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  const { text, from = "uk", to } = req.body;
  console.log("i'm here")
  if (!text || !to) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${from}|${to}`;

    const response = await fetch(url);
    const data = await response.json();

    const translated =
      data?.responseData?.translatedText && data.responseStatus === 200
        ? data.responseData.translatedText
        : text;

    res.json({ text: translated });
  } catch (err) {
    console.error("Translate error:", err);
    res.json({ text }); // fallback
  }
});

module.exports = router;
