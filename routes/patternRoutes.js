const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const patternsDir = path.join(__dirname, '../patterns');

if (!fs.existsSync(patternsDir)) {
  fs.mkdirSync(patternsDir);
}

const sanitize = (name) =>
  name.replace(/[<>:"/\\|?*]+/g, '_');

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, patternsDir),
  filename: (req, file, cb) => {
    const safeName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, sanitize(safeName));
  }
});
const upload = multer({ storage });

router.get('/', (req, res) => {
  fs.readdir(patternsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Не удалось прочитать папку patterns' });
    res.json({ files });
  });
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не был загружен' });
  res.json({ message: 'Файл успешно загружен', file: req.file.filename });
});

router.delete('/:filename', (req, res) => {
  const filePath = path.join(patternsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден' });

  fs.unlink(filePath, (err) => {
    if (err) return res.status(500).json({ error: 'Ошибка при удалении файла' });
    res.json({ message: 'Файл удалён' });
  });
});

router.put('/rename', (req, res) => {
  const { oldName, newName } = req.body;
  if (!oldName || !newName) return res.status(400).json({ error: 'Укажите oldName и newName' });

  const oldPath = path.join(patternsDir, oldName);
  const newPath = path.join(patternsDir, newName);

  if (!fs.existsSync(oldPath)) return res.status(404).json({ error: 'Исходный файл не найден' });

  fs.rename(oldPath, newPath, (err) => {
    if (err) return res.status(500).json({ error: 'Ошибка при переименовании файла' });
    res.json({ message: 'Файл переименован', newName });
  });
});

router.get('/download/:filename', (req, res) => {
  const filePath = path.join(patternsDir, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Файл не найден' });

  res.download(filePath);
});

module.exports = router;
