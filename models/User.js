const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        login: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true }, // hash
        discount: { type: Number, default: 0 } // %
    },
    { timestamps: true }
)

module.exports = mongoose.model("User", userSchema)
