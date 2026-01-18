const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User.js');
const authMiddleware = require("../middleware/auth.js")

const router = express.Router()


router.get("/me", authMiddleware, async (req, res) => {
    try {
        res.json({ user: req.user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Помилка сервера" });
    }
});

router.post("/register", async (req, res) => {
    try {
        const { name, login, email, password } = req.body

        const exists = await User.findOne({ $or: [{ email }, { login }] })
        if (exists) return res.status(400).json({ message: "Користувач вже існує" })

        const hash = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            login,
            email,
            password: hash,
            discount: 0
        })

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({ token, user })
    } catch (e) {
        res.status(500).json({ message: "Помилка сервера" })
    }
})

router.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body

        const user = await User.findOne({ login })
        if (!user) return res.status(400).json({ message: "Невірні дані" })

        const ok = await bcrypt.compare(password, user.password)
        if (!ok) return res.status(400).json({ message: "Невірні дані" })

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({ token, user })
    } catch {
        res.status(500).json({ message: "Помилка сервера" })
    }
})

module.exports = router;
