const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const { status, comment } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status, comment },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) return res.status(404).json({ error: "Замовлення не знайдено" });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        const validStatuses = ["new", "processing", "shipped", "completed", "cancelled"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: "Недопустимый статус" });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) return res.status(404).json({ error: "Заказ не найден" });

        res.json(order);
    } catch (err) {
        console.error("❌ Error updating status:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});

module.exports = router;
