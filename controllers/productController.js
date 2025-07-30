const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Product = require('../models/Product');

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Продукт не найден' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({ error: 'Продукт не найден' });
    }

    res.json({ message: 'Продукт удалён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.updatePrintPrices = async (req, res) => {
  try {
    const { category, filename } = req.body;

    if (!category || !filename) {
      return res.status(400).json({ error: 'Не указана категория или имя файла' });
    }

    const filePath = path.join(__dirname, '../patterns', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' });
    }

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const range = XLSX.utils.decode_range(worksheet['!ref']);

    const printOptions = [];

    const quantities = [];
    for (let col = 1; col <= range.e.c; col++) {
      const cellAddress = { c: col, r: 0 };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = worksheet[cellRef];
      if (cell && cell.v) {
        const quantity = parseInt(cell.v, 10);
        if (!isNaN(quantity)) {
          quantities.push({ col, quantity });
        }
      }
    }

    for (let row = 1; row <= range.e.r; row++) {
      const codeCellAddress = { c: 0, r: row };
      const codeCellRef = XLSX.utils.encode_cell(codeCellAddress);
      const codeCell = worksheet[codeCellRef];

      if (!codeCell || !codeCell.v) continue;

      const code = codeCell.v.toString().trim();

      for (const { col, quantity } of quantities) {
        const priceCellAddress = { c: col, r: row };
        const priceCellRef = XLSX.utils.encode_cell(priceCellAddress);
        const priceCell = worksheet[priceCellRef];

        const price = priceCell ? parseFloat(priceCell.v) : NaN;
        if (!isNaN(price)) {
          printOptions.push({ code, quantity, price });
        }
      }
    }

    if (printOptions.length === 0) {
      return res.status(400).json({ error: 'Не удалось извлечь данные из файла' });
    }

    const result = await Product.updateMany(
      { category },
      { $set: { printOptions } }
    );

    res.json({
      message: `Цены на печать обновлены для ${result.modifiedCount} товаров категории "${category}"`,
      updatedCount: result.modifiedCount,
      printOptions,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обработке файла или обновлении базы данных' });
  }
};