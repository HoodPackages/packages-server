const mongoose = require('mongoose');

const printOptionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    match: /^\d+x\d+$/ // например: 2x1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const bulkPricingSchema = new mongoose.Schema({
  minQty: {
    type: Number,
    required: true,
    min: 1
  },
  priceMultiplier: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    validate: {
      validator: v => /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/.test(v),
      message: props => `${props.value} не является допустимой ссылкой на изображение`
    }
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  printOptions: {
    type: [printOptionSchema],
    default: []
  },
  bulkPricing: {
    type: [bulkPricingSchema],
    default: []
  },
  tags: {
    type: [String],
    index: true,
    default: []
  }
}, {
  timestamps: true // автоматически добавит createdAt и updatedAt
});

module.exports = mongoose.model('Product', productSchema);
