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

router.get("/:id", async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send("Тикет не найден");
        res.json(ticket);
    } catch (err) {
        console.error("Ошибка при получении тикета:", err);
        res.status(500).send("Ошибка сервера");
    }
});

router.patch("/:id", async (req, res) => {
    try {
        const { subject, from, status } = req.body;

        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) return res.status(404).send("Тикет не найден");

        if (subject !== undefined) ticket.subject = subject;
        if (from !== undefined) ticket.from = from;
        if (status !== undefined) ticket.status = status;

        await ticket.save();
        res.json(ticket);
    } catch (err) {
        console.error("Ошибка при обновлении тикета:", err);
        res.status(500).send("Ошибка сервера");
    }
});

router.post("/merge", async (req, res) => {
  try {
    const { targetTicketNumber, ticketsToMerge } = req.body;

    if (!targetTicketNumber || !Array.isArray(ticketsToMerge) || ticketsToMerge.length === 0) {
      return res.status(400).json({ error: "Нужно указать целевой тикет и тикеты для слияния" });
    }

    // Находим целевой тикет по номеру
    const targetTicket = await Ticket.findOne({ ticketNumber: targetTicketNumber });
    if (!targetTicket) {
      return res.status(404).json({ error: "Целевой тикет не найден" });
    }

    // Находим тикеты для слияния (по _id из чекбоксов)
    const mergeTickets = await Ticket.find({ _id: { $in: ticketsToMerge } });
    if (mergeTickets.length === 0) {
      return res.status(400).json({ error: "Не найдены тикеты для слияния" });
    }

    // Проверка, что все тикеты принадлежат одному пользователю
    const sameUser = mergeTickets.every(t => t.from === targetTicket.from);
    if (!sameUser) {
      return res.status(400).json({ error: "Можно объединять только тикеты одного пользователя" });
    }

    // Объединяем сообщения
    let mergedMessages = [...targetTicket.messages];
    for (const t of mergeTickets) {
      mergedMessages.push(...t.messages);
    }

    // Сортировка сообщений по времени
    mergedMessages.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Сохраняем изменения в целевом тикете
    targetTicket.messages = mergedMessages;
    await targetTicket.save();

    // Обновляем остальные тикеты — например, меняем статус
    await Ticket.updateMany(
      { _id: { $in: mergeTickets.map(t => t._id) } },
      { $set: { status: "merged" } }
    );

    res.json({ success: true, message: "Тикеты объединены", targetTicket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Ошибка при слиянии тикетов" });
  }
});

router.post("/contactUs", async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    const formattedMessage = `Ім’я:\n${name}\n\nEmail:\n${email}\n\nТелефон:\n${phone}\n\nТема:\n${subject}\n\nПовідомлення:\n${message}`.trim();

    const htmlContent = `
        <p><strong>Ім’я:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Телефон:</strong> ${phone}</p>
        <p><strong>Тема:</strong> ${subject}</p>
        <p><strong>Повідомлення:</strong><br>${(message || "").replace(/\n/g, "<br>")}</p>
    `;

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
            from: `Форма Contact Us`,
            to: process.env.EMAIL_USER,
            subject: subject,
            text: formattedMessage,
            html: htmlContent,
        });

        const latestTicket = await Ticket.findOne().sort({ ticketNumber: -1 });
        const newTicketNumber = latestTicket ? latestTicket.ticketNumber + 1 : 1000;

        await Ticket.create({
            ticketNumber: newTicketNumber,
            from: 'Форма Contact Us',
            subject,
            status: "awaiting reply",
            date: new Date(),
            messages: [
                {
                    text: formattedMessage,
                    direction: "in",
                    date: new Date(),
                },
            ],
        });

        res.status(200).send("Звернення успішно надіслано");
    } catch (error) {
        console.error("Помилка при надсиланні повідомлення:", error);
        res.status(500).send("Не вдалося надіслати звернення");
    }
});

module.exports = router;
