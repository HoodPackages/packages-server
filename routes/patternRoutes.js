const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/', (req, res) => {
  const dir = path.join(__dirname, "../patterns");
  fs.readdir(dir, (err, files) => {
    if (err) return res.status(500).json({ error: "Не удалось прочитать папку patterns" });
    res.json({ files });
  });
});

module.exports = router;
