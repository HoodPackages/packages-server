const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const patternsRoutes = require('./routes/patternRoutes');
const supportRoutes = require('./routes/supportRoutes');
const { checkInbox } = require("./services/mailFetcher");

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/patterns', patternsRoutes);
app.use('/api/support', supportRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на ${PORT}`);
});

checkInbox();

setInterval(() => {
  console.log("🔄 Проверка почты...");
  checkInbox();
}, 1 * 60 * 1000);