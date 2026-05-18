require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('./src/models/Product');

const CATEGORIES = [
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
];

const CATEGORY_PRODUCTS = {
  Electronics: ['Wireless Headphones', 'Smart TV', 'Laptop', 'Tablet', 'Smartwatch', 'Bluetooth Speaker', 'Gaming Mouse', 'Mechanical Keyboard', 'Webcam', 'Monitor'],
  Apparel: ['Running Shoes', 'Denim Jacket', 'Polo Shirt', 'Yoga Pants', 'Winter Coat', 'Baseball Cap', 'Leather Belt', 'Silk Scarf', 'Sports Socks', 'Wool Sweater'],
  'Home & Garden': ['Garden Hose', 'Throw Pillow', 'Coffee Maker', 'Air Purifier', 'Table Lamp', 'Curtain Set', 'Doormat', 'Plant Pot', 'Broom Set', 'Storage Bins'],
  'Sports & Outdoors': ['Yoga Mat', 'Resistance Bands', 'Hiking Backpack', 'Camping Tent', 'Bicycle Helmet', 'Jump Rope', 'Water Bottle', 'Trekking Poles', 'Gym Gloves', 'Foam Roller'],
  'Food & Beverage': ['Protein Powder', 'Green Tea', 'Olive Oil', 'Mixed Nuts', 'Energy Bar', 'Coffee Beans', 'Sparkling Water', 'Hot Sauce', 'Granola', 'Kombucha'],
  'Health & Beauty': ['Vitamin C Serum', 'Electric Toothbrush', 'Face Mask', 'Shampoo Bar', 'Sunscreen SPF 50', 'Nail Polish Set', 'Essential Oil', 'Beard Trimmer', 'Lip Balm', 'Hand Cream'],
  Automotive: ['Car Phone Mount', 'Dash Cam', 'Jump Starter', 'Tire Inflator', 'Car Cover', 'Seat Cushion', 'Air Freshener', 'USB Car Charger', 'Steering Wheel Cover', 'Windshield Sunshade'],
  'Toys & Games': ['Board Game', 'Action Figure', 'LEGO Set', 'Puzzle', 'Remote Control Car', 'Stuffed Animal', 'Card Game', 'Science Kit', 'Play-Doh', 'Doll'],
  'Books & Media': ['Self-Help Book', 'Thriller Novel', 'Cookbook', 'Programming Guide', 'History Book', 'Art Journal', 'Language Course', 'Documentary DVD', 'Business Strategy', 'Science Fiction Novel'],
  'Office Supplies': ['Sticky Notes', 'Ballpoint Pens', 'Desk Organizer', 'Stapler', 'Whiteboard', 'File Folders', 'Correction Tape', 'Highlighters', 'Binder Clips', 'Notebook'],
};

const BATCH_SIZE = 500;
const TOTAL_PRODUCTS = 50000;

/**
 * Generates a single realistic mock product
 */
function generateProduct(index) {
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const baseProducts = CATEGORY_PRODUCTS[category];
  const baseName = baseProducts[Math.floor(Math.random() * baseProducts.length)];
  const brand = faker.company.name().split(' ')[0];
  const productName = `${brand} ${baseName} ${faker.commerce.productAdjective()}`;

  const cost = parseFloat(faker.commerce.price({ min: 2, max: 800, dec: 2 }));
  const price = parseFloat((cost * (1 + Math.random() * 0.8 + 0.1)).toFixed(2)); // 10%-90% margin

  const stockQuantity = Math.random() < 0.05
    ? 0  // 5% out of stock
    : Math.random() < 0.15
    ? faker.number.int({ min: 1, max: 10 })  // 15% critically low
    : faker.number.int({ min: 11, max: 5000 });

  const skuPrefix = category.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
  const sku = `${skuPrefix}-${String(index + 1).padStart(6, '0')}-${faker.string.alphanumeric(4).toUpperCase()}`;

  return {
    productName: productName.substring(0, 200),
    sku,
    category,
    price,
    cost,
    stockQuantity,
    reorderLevel: faker.number.int({ min: 5, max: 50 }),
    lastUpdated: faker.date.recent({ days: 180 }),
  };
}

async function seed() {
  console.log('🌱 Aura Engine — Database Seeder');
  console.log('=================================');

  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    const existingCount = await Product.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Clearing ${existingCount.toLocaleString()} existing products...`);
      await Product.deleteMany({});
    }

    // Ensure indexes are built before inserting
    await Product.createIndexes();
    console.log('📑 Indexes ensured');

    console.log(`\n⏳ Generating ${TOTAL_PRODUCTS.toLocaleString()} products in batches of ${BATCH_SIZE}...`);

    const startTime = Date.now();
    let totalInserted = 0;

    for (let i = 0; i < TOTAL_PRODUCTS; i += BATCH_SIZE) {
      const batch = [];
      const batchEnd = Math.min(i + BATCH_SIZE, TOTAL_PRODUCTS);

      for (let j = i; j < batchEnd; j++) {
        batch.push(generateProduct(j));
      }

      await Product.insertMany(batch, { ordered: false });
      totalInserted += batch.length;

      const progress = ((totalInserted / TOTAL_PRODUCTS) * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      process.stdout.write(`\r   Progress: ${totalInserted.toLocaleString()} / ${TOTAL_PRODUCTS.toLocaleString()} (${progress}%) — ${elapsed}s elapsed`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n\n✅ Seeding complete!`);
    console.log(`   Inserted: ${totalInserted.toLocaleString()} products`);
    console.log(`   Time:     ${elapsed}s`);
    console.log(`   Rate:     ${Math.round(totalInserted / elapsed).toLocaleString()} products/sec`);

    // Verify counts
    const finalCount = await Product.countDocuments();
    console.log(`   Verified: ${finalCount.toLocaleString()} documents in DB`);

  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
