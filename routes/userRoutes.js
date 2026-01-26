const User = require('../models/User.js');
const express = require('express');

const router = express.Router()

router.get("/", async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json(user);
    } catch (err) {
        // ❗ некорректный ObjectId тоже сюда попадёт
        console.error(err);
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.patch("/:id/discount", async (req, res) => {
    try {
        const { discount } = req.body;

        if (discount < 0 || discount > 100) {
            return res.status(400).json({ error: "Некоректна знижка" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { discount },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "Користувача не знайдено" });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});


router.patch("/:id", async (req, res) => {
    const allowedFields = ["name", "email"];
    const updates = {};

    for (const key of allowedFields) {
        if (req.body[key]) updates[key] = req.body[key];
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true }
        ).select("-password");

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Помилка сервера" });
    }
});


module.exports = router;