const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

router.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        console.error("❌ Error fetching orders:", err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.put("/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
        console.error("❌ Error updating status:", err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});
