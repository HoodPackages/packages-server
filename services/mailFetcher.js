const imaps = require("imap-simple");
const Ticket = require("../models/Ticket");
const { simpleParser } = require("mailparser");
require("dotenv").config();

const config = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,
    host: process.env.IMAP_HOST,
    port: Number(process.env.IMAP_PORT),
    tls: true,
    authTimeout: 5000,
    tlsOptions: { rejectUnauthorized: false },
  },
};

async function checkInbox() {
  const connection = await imaps.connect(config);
  await connection.openBox("INBOX");

  const searchCriteria = ["UNSEEN"];
  const fetchOptions = {
    bodies: [""],
    markSeen: true,
  };

  const messages = await connection.search(searchCriteria, fetchOptions);

  for (const item of messages) {
    const raw = item.parts.find((part) => part.which === "").body;

    try {
      const parsed = await simpleParser(raw);

      const from = parsed.from?.text || "Неизвестно";
      const subject = parsed.subject || "Без темы";
      const parsedText = parsed.text || parsed.html || "Без текста";

      // Найти последний тикет от этого отправителя с сортировкой по ticketNumber
      const lastTicket = await Ticket.findOne({ from }).sort({ ticketNumber: -1 });

      if (lastTicket) {
        // Добавить сообщение в существующий тикет
        lastTicket.messages.push({
          text: parsedText,
          direction: "in",
          date: new Date(),
        });
        lastTicket.status = "awaiting reply";
        await lastTicket.save();
        console.log(`✅ Добавлено сообщение в тикет #${lastTicket.ticketNumber} от ${from}`);
      } else {
        // Создать новый тикет с уникальным ticketNumber
        const latestTicket = await Ticket.findOne().sort({ ticketNumber: -1 });
        const newTicketNumber = latestTicket ? latestTicket.ticketNumber + 1 : 1000;

        await Ticket.create({
          ticketNumber: newTicketNumber,
          from,
          subject,
          status: "awaiting reply",
          date: new Date(),
          messages: [
            {
              text: parsedText,
              direction: "in",
              date: new Date(),
            },
          ],
        });
        console.log(`✅ Создан новый тикет #${newTicketNumber} от ${from}`);
      }
    } catch (err) {
      console.error("❌ Ошибка парсинга письма:", err);
    }
  }

  await connection.end();
}

module.exports = {
  checkInbox,
};
