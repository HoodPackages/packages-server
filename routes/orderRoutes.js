const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../uploads/order-layouts");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

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

        if (order.layout?.pathOnDisk) {
            if (fs.existsSync(order.layout.pathOnDisk)) {
                fs.unlinkSync(order.layout.pathOnDisk);
            } else {
                console.warn("⚠️ Макет не найден:", order.layout.pathOnDisk);
            }
        }

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

router.put("/:id/edit", upload.single("layout"), async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: "Заказ не найден" });

        const { contact, delivery, paymentMethod, comment, language } = req.body;

        if (contact) order.contact = JSON.parse(contact);
        if (delivery) order.delivery = JSON.parse(delivery);
        if (paymentMethod) order.paymentMethod = paymentMethod;
        if (comment !== undefined) order.comment = comment;
        if (language) order.language = language;

        if (req.file) {
            if (order.layout?.pathOnDisk && fs.existsSync(path.join(__dirname, "../uploads", order.layout.pathOnDisk))) {
                fs.unlinkSync(path.join(__dirname, "../uploads", order.layout.pathOnDisk));
            }

            order.layout = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                pathOnDisk: `/order-layouts/${req.file.filename}`,
                path: `/order-layouts/${req.file.filename}`
            };
        }

        await order.save();
        res.json(order);
    } catch (err) {
        console.error("❌ Ошибка при редактировании заказа:", err);
        res.status(500).json({ error: "Ошибка сервера" });
    }
});


module.exports = router;
