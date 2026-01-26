const path = require('path');
const express = require("express");
const router = express.Router();
const fs = require("fs");
const multer = require("multer");
const getI18n = require("../services/i18n");

const Order = require("../models/Order");
const sendOrderToTelegram = require('../services/telegram');
const generateInvoicePdf = require("../services/generateInvoicePdf");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, "../order-layouts");
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${Date.now()}${ext}`);
    }
});

const upload = multer({ storage });
router.post("/generate-order", upload.single("layout"), async (req, res) => {
    try {
        const contact = JSON.parse(req.body.contact || "{}");
        const delivery = JSON.parse(req.body.delivery || "{}");
        const cart = JSON.parse(req.body.cart || "[]");

        const paymentMethod = req.body.paymentMethod;
        const total = Number(req.body.total);
        const language = req.body.language || "en";
        const comment = req.body.comment || "";

        const layoutFile = req.file
            ? {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                pathOnDisk: req.file.path,
                path: `/order-layouts/${req.file.filename}`
            }
            : undefined;
        const newOrder = new Order({ contact, delivery, cart, paymentMethod, total, status: "new", language, comment, layout: layoutFile });
        await newOrder.save();

        const t = getI18n(language);

        const doc = generateInvoicePdf({
            ...newOrder.toObject(),
            t
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", async () => {
            const pdfBuffer = Buffer.concat(chunks);

            await sendOrderToTelegram(newOrder, pdfBuffer, layoutFile ? [layoutFile] : []);

            res.status(201).json({ orderId: newOrder._id, message: "Замовлення успішно створене" });
        });

        doc.end();
    } catch (err) {
        console.error("❌ Помилка при генерації замовлення:", err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.get("/:id/invoice", async (req, res) => {
    try {
        const language = req.query.lang || "en";
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: "Order not found" });
        }

        const t = getI18n(language);

        const doc = generateInvoicePdf({
            ...order.toObject(),
            t
        });

        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
            const pdfBuffer = Buffer.concat(chunks);
            res
                .setHeader("Content-Type", "application/pdf")
                .setHeader("Content-Disposition", "inline; filename=invoice.pdf")
                .end(pdfBuffer);
        });

        doc.end();
    } catch (err) {
        console.error("❌ Error generating invoice:", err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

module.exports = router;