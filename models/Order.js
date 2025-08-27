const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    contact: {
        name: String,
        phone: String,
        email: String,
    },
    delivery: {
        method: String,
        address: String,
    },
    cart: [
        {
            name: String,
            quantity: Number,
            price: Number,
        }
    ],
    paymentMethod: String,
    total: Number,
    status: { type: String, default: "new" },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
