require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

const bot = new TelegramBot(token, { polling: false });

async function sendOrderToTelegram(order, pdfBuffer, files = []) {
  let text = `📦 Нове замовлення #${order._id}\n`;

  if (order.contact?.name) text += `👤 Замовник: ${order.contact.name}\n`;
  if (order.contact?.phone) text += `📞 Телефон: ${order.contact.phone}\n`;
  if (order.contact?.email) text += `📧 Email: ${order.contact.email}\n`;
  if (order.delivery?.method || order.delivery?.address)
    text += `🚚 Доставка: ${order.delivery.method || "-"} — ${order.delivery.address || "-"}\n`;
  if (order.paymentMethod) text += `💳 Оплата: ${order.paymentMethod}\n`;
  if (order.comment) text += `💬 Коментар: ${order.comment}\n`;

  if (order.cart?.length) {
    text += `\n🛒 Товари:\n`;
    text += order.cart.map(i => `• ${i.name} — ${i.quantity} x ${i.price} грн`).join("\n");
  }

  if (order.total) text += `\n\n💰 Разом: ${order.total} грн`;

  await bot.sendMessage(chatId, text);

  // PDF
  await bot.sendDocument(chatId, pdfBuffer, {}, { filename: "invoice.pdf", contentType: "application/pdf" });

  // Файлы-макеты
  for (const f of files) {
    if (f && f.buffer && f.originalname) {
      await bot.sendDocument(chatId, f.buffer, {}, { filename: f.originalname, contentType: f.mimetype || "application/octet-stream" });
    }
  }
}

module.exports = sendOrderToTelegram;
