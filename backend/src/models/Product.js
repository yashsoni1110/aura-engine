const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'Apparel',
        'Home & Garden',
        'Sports & Outdoors',
        'Food & Beverage',
        'Health & Beauty',
        'Automotive',
        'Toys & Games',
        'Books & Media',
        'Office Supplies',
      ],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    cost: {
      type: Number,
      required: [true, 'Cost is required'],
      min: [0, 'Cost cannot be negative'],
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    reorderLevel: {
      type: Number,
      required: [true, 'Reorder level is required'],
      min: [0, 'Reorder level cannot be negative'],
      default: 10,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound text index for omnisearch
productSchema.index({ productName: 'text', sku: 'text' });

// Pre-save validation: price must be >= cost
productSchema.pre('save', function (next) {
  if (this.price < this.cost) {
    const err = new Error('Price cannot be lower than cost');
    err.statusCode = 400;
    return next(err);
  }
  this.lastUpdated = new Date();
  next();
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
