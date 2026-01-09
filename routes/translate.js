const express = require("express");
const bodyParser = require("body-parser");
const translate = require("@vitalets/google-translate-api");

const router = express.Router();
router.use(bodyParser.json());

router.post("/", async (req, res) => {
  const { text, from, to } = req.body;

  if (!text || !to) {
    return res.status(400).json({ error: "Invalid payload" });
  }

  try {
    const result = await translate(text, { from: from || "uk", to });
    res.json({ text: result.text });
  } catch (err) {
    console.error("Translate error:", err);
    res.json({ text }); // fallback — оригинал
  }
});

module.exports = router;
