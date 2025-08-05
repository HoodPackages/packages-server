const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  ticketNumber: { type: Number, unique: true }, // новый
  from: String,
  subject: String,
  body: String,
  date: Date,
  status: { type: String, default: "awaiting reply" },
  messages: [
    {
      text: String,
      direction: { type: String, enum: ["in", "out"] }, // in = от пользователя, out = наш ответ
      date: Date
    }
  ]
});

module.exports = mongoose.model("Ticket", ticketSchema);