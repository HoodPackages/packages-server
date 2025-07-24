const Product = require('../models/Product');

// GET /api/products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка получения данных' });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  try {
    const newProduct = await Product.create(req.body);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // вернуть обновлённый документ
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: 'Продукт не найден' });
    }

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE /api/products/:id
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