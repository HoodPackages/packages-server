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
        const allProducts = [];

        for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(worksheet);

            // Удаляем старые товары этой категории
            await Product.deleteMany({ category: sheetName });

            const categoryProducts = [];

            for (const row of rows) {
                const priceArray = [];

                for (const key of Object.keys(row)) {
                    const match = key.match(/^От\s+(\d+)\s+шт$/i);
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

                    printOptions: [],
                });

                categoryProducts.push(product);
            }

            // Добавляем новые товары этой категории
            if (categoryProducts.length > 0) {
                await Product.insertMany(categoryProducts);
                allProducts.push(...categoryProducts);
            }
        }

        res.json({ success: true, added: allProducts.length });
    } catch (error) {
        console.error('Помилка при обробці Excel:', error);
        res.status(500).json({ error: 'Помилка при обробці файлу' });
    }
});

router.get('/export', async (req, res) => {
    try {
        const products = await Product.find();

        if (!products.length) {
            return res.status(404).json({ error: 'Нет товаров для экспорта' });
        }

        const categories = {};

        for (const product of products) {
            if (!categories[product.category]) {
                categories[product.category] = [];
            }

            const row = {
                'Наименование': product.name || '',
                'Валюта': product.currency || ''
            };

            for (const priceEntry of product.price || []) {
                row[`От ${priceEntry.minQty} шт`] = priceEntry.price;
            }

            Object.assign(row, {
                'Описание': product.description || '',
                'Теги': product.tags || '',
                'Тип товаров': product.type || '',
                'Вес': product.weight || '',
                'Цвет': product.color || '',
                'Метод нанесения': product.appMethod || '',
                'Материал': product.material || '',
                'Донная складка': product.bottom ? 'Да' : '',
                'Усиленная ручка': product.handle ? 'Да' : '',
                'Цвет ручек': product.handleColor || '',
                'Плотность': product.density || '',
                'Размер': product.size || '',
                'Карман для документов': product.docsPocket ? 'Да' : '',
                'Липкий клапан': product.stickyAss ? 'Да' : '',
                'Окно': product.window ? 'Да' : '',
                'Zip-замок': product.zipLock ? 'Да' : '',
                'Изображения': product.images || ''
            });

            categories[product.category].push(row);
        }

        const workbook = xlsx.utils.book_new();

        for (const [category, rows] of Object.entries(categories)) {
            const worksheet = xlsx.utils.json_to_sheet(rows);
            xlsx.utils.book_append_sheet(workbook, worksheet, category);
        }

        const exportPath = path.join(__dirname, '..', 'uploads', 'products_export.xlsx'); // <-- путь с именем файла
        xlsx.writeFile(workbook, exportPath);

        res.download(exportPath, 'products_export.xlsx', err => {
            if (err) {
                console.error('Ошибка при отправке файла:', err);
                res.status(500).json({ error: 'Не удалось отправить файл' });
            } else {
                // Удалить файл после скачивания
                fs.unlink(exportPath, () => { });
            }
        });
    } catch (err) {
        console.error('Ошибка при экспорте:', err);
        res.status(500).json({ error: 'Ошибка при экспорте товаров' });
    }
});

module.exports = router;
