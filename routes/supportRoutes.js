const express = require("express");
const router = express.Router();
const Ticket = require("../models/Ticket");
const nodemailer = require("nodemailer");
require("dotenv").config();

router.get("/", async (req, res) => {
    const tickets = await Ticket.find().sort({ date: -1 });
    res.json(tickets);
});

router.post("/:id/reply", async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).send("Тикет не найден");

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT),
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        tls: {
            rejectUnauthorized: false,
        },
    });

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: ticket.from,
            subject: "Ответ: " + ticket.subject,
            text,
            html: `<p>${text}</p>`,
        });

        ticket.status = "answered";

        ticket.messages.push({
            text,
            direction: "out",
            date: new Date()
        });

        await ticket.save();
        res.send("Ответ отправлен");
    } catch (error) {
        console.error("Ошибка при отправке письма:", error);
        res.status(500).send("Не удалось отправить письмо");
    }
});

router.get("/by-number/:ticketNumber", async (req, res) => {
    const ticket = await Ticket.findOne({ ticketNumber: req.params.ticketNumber });
    if (!ticket) return res.status(404).send("Тикет не найден");
    res.json(ticket);
});

module.exports = router;
