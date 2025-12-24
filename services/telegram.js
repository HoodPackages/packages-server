require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: false });

async function sendOrderToTelegram(order, pdfBuffer) {
    const text = `
📦 Нове замовлення #${order._id}

👤 Замовник: ${order.contact.name}
📞 Телефон: ${order.contact.phone}
📧 Email: ${order.contact.email || "-"}

🚚 Доставка: ${order.delivery.method} — ${order.delivery.address}
💳 Оплата: ${order.paymentMethod}

🛒 Товари:
${order.cart.map(i => `• ${i.name} — ${i.quantity} x ${i.price} грн`).join("\n")}

💰 Разом: ${order.total} грн
  `;

    await bot.sendMessage(chatId, text);

    // отправляем PDF в группу
    await bot.sendDocument(chatId, pdfBuffer, {}, { filename: "invoice.pdf", contentType: "application/pdf" });
}

module.exports = sendOrderToTelegram;
