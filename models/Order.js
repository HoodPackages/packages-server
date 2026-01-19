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
    comment: { type: String, required: false },
    layout: {
        filename: String,        // имя файла на сервере
        originalName: String,    // оригинальное имя
        mimeType: String,        // image/png, image/jpeg, application/pdf
        size: Number,            // байты
        pathOnDisk: String,
        path: String             // /uploads/layouts/xxx.png
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", orderSchema);
