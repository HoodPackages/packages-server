const mongoose = require('mongoose');

const printOptionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    match: /^\d+x\d+$/ // например: 2+1
  },
  quantity: {
    type: Number,
    requried: true
  },
  price: {
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
  category: {
    type: String,
    required: true
  },
  currency: {
    type: String,
    required: true,
  },
  price: {
    type: [
      {
        minQty: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        }
      }
    ],
    validate: {
      validator: function (arr) {
        const seen = new Set();
        return arr.every(p => {
          if (seen.has(p.minQty)) return false;
          seen.add(p.minQty);
          return true;
        });
      },
      message: 'Кількість кожної цінової категорії має бути унікальною.',
    },
    required: true,
  },
  description: {
    type: String,
    default: '',
    required: true
  },
  tags: {
    type: [String],
    index: true,
    default: [],
    required: false
  },
  type: {
    type: String,
    required: true,
    trim: true,
    required: true
  },
  weight: {
    type: String,
    required: false
  },
  color: {
    type: String,
    required: true,
  },
  appMethod: {
    type: String,
    required: false,
  },
  material: {
    type: String,
    required: true
  },
  bottom: {
    type: Boolean,
    required: false
  },
  handle: {
    type: Boolean,
    required: false
  },
  handleColor: {
    type: String,
    required: false,
  },
  density: {
    type: String,
    required: true
  },
  size: {
    type: String,
    required: true,
  },
  docsPocket: {
    type: Boolean,
    required: false
  },
  stickyAss: {
    type: Boolean,
    required: false
  },
  window: {
    type: Boolean,
    required: false
  },
  zipLock: {
    type: Boolean,
    required: false
  },
  images: {
    type: [String],
    validate: {
      validator: arr => arr.every(
        v => /^https?:\/\/.+\.(jpg|jpeg|png|webp)$/i.test(v)
      ),
      message: props => `Один или несколько URL не являются допустимыми ссылками на изображение: ${props.value}`
    }
  },
  printOptions: {
    type: [printOptionSchema],
    default: []
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
