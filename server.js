const cors = require('cors');
const dotenv = require('dotenv');
const express = require('express');
const connectDB = require('./config/db');
const pdfRoutes = require('./routes/pdfRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const productRoutes = require('./routes/productRoutes');
const supportRoutes = require('./routes/supportRoutes');
const patternsRoutes = require('./routes/patternRoutes');
const { checkInbox } = require("./services/mailFetcher");
const authRoutes = require('./routes/authRoutes');

dotenv.config();

connectDB().catch(err => {
  console.error("❌ Ошибка подключения к БД:", err);
  process.exit(1);
});

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.json()(req, res, next);
});

app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/patterns', patternsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на ${PORT}`);
  setTimeout(checkInbox, 5000);
});

setInterval(() => {
  try {
    console.log("🔄 Проверка почты...");
    checkInbox();
  }
  catch (err) {
    console.error("Ошибка при проверке почты: ", err);
  }
}, 5 * 60 * 1000);