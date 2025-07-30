const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const Product = require('../models/Product');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),

    filename: (req, file, cb) => {
        const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        cb(null, decodedName);
    },
});

const upload = multer({ storage });

router.post('/', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Файл не надіслано' });

    try {
        const filePath = path.join(uploadDir, req.file.filename);
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const products = [];

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet);

            for (const row of rows) {
                const priceArray = [];

                for (const key of Object.keys(row)) {
                    const match = key.match(/^От\s+(\d+)\s+шт$/i); // ищем "От 100 шт", "От 500 шт", ...

                    if (match) {
                        const minQty = parseInt(match[1], 10);
                        const priceValue = Number(row[key]);

                        if (!isNaN(priceValue)) {
                            priceArray.push({ minQty, price: priceValue });
                        }
                    }
                }

                const product = new Product({
                    name: row['Наименование']?.toString().trim() || 'Без назви',
                    category: sheetName,
                    currency: row['Валюта']?.toString().trim() || '',
                    price: priceArray,
                    description: row['Описание']?.toString().trim() || '',
                    tags: row['Теги']?.toString().trim() || '',
                    type: row['Тип товаров']?.toString().trim() || '',

                    weight: row['Вес']?.toString().trim() || '',
                    color: row['Цвет']?.toString().trim() || '',
                    appMethod: row['Метод нанесения']?.toString().trim() || '',
                    material: row['Материал']?.toString().trim() || '',
                    bottom: !!row['Донная складка']?.toString().trim(),
                    handle: !!row['Усиленная ручка']?.toString().trim(), 
                    handleColor: row['Цвет ручек']?.toString().trim() || '',
                    density: row['Плотность']?.toString().trim() || '',
                    size: row['Размер']?.toString().trim() || '',
                    docsPocket: !!row['Карман для документов']?.toString().trim(),
                    stickyAss: !!row['Липкий клапан']?.toString().trim(),
                    window: !!row['Окно']?.toString().trim(),
                    zipLock: !!row['Zip-замок']?.toString().trim(),
                    images: row['Изображения']?.toString().trim() || '',

                    printOptions: [], // пока оставляем пустым
                });

                products.push(product);
            }
        }

        await Product.insertMany(products);

        res.json({ success: true, added: products.length });
    } catch (error) {
        console.error('Помилка при обробці Excel:', error);
        res.status(500).json({ error: 'Помилка при обробці файлу' });
    }
});

module.exports = router;
