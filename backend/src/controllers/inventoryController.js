const Product = require('../models/Product');

/**
 * GET /api/inventory
 * Paginated, filtered, and sorted inventory list.
 */
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      category = '',
      sort = '-lastUpdated',
      minPrice = 0,
      maxPrice,
      maxStock,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build query filter
    const filter = {};
    const trimmedSearch = search.trim();

    if (trimmedSearch) {
      if (trimmedSearch.length >= 2) {
        filter.$text = { $search: trimmedSearch };
      } else {
        filter.$or = [
          { productName: { $regex: `^${trimmedSearch}`, $options: 'i' } },
          { sku: { $regex: `^${trimmedSearch}`, $options: 'i' } },
        ];
      }
    }

    if (category) filter.category = category;

    const parsedMin = parseFloat(minPrice) || 0;
    const parsedMax = maxPrice !== undefined ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
    if (parsedMin > 0 || parsedMax < Number.MAX_SAFE_INTEGER) {
      filter.price = { $gte: parsedMin, $lte: parsedMax };
    }

    if (maxStock !== undefined && maxStock !== '') {
      filter.stockQuantity = { $lte: parseInt(maxStock, 10) };
    }

    // Build sort conditions
    let sortObj = {};
    if (trimmedSearch && trimmedSearch.length >= 2 && !sort) {
      sortObj = { score: { $meta: 'textScore' }, _id: 1 };
    } else {
      const sortFields = sort.split(',');
      sortFields.forEach((field) => {
        const direction = field.startsWith('-') ? -1 : 1;
        const fieldName = field.replace(/^-/, '');
        sortObj[fieldName] = direction;
      });
    }

    // Execute database query
    const projection = trimmedSearch && trimmedSearch.length >= 2
      ? { score: { $meta: 'textScore' } }
      : {};

    const [products, totalRecords] = await Promise.all([
      Product.find(filter, projection).sort(sortObj).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limitNum);

    res.json({
      success: true,
      data: products,
      pagination: {
        totalRecords,
        totalPages,
        currentPage: pageNum,
        limit: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error('getInventory error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory', error: error.message });
  }
};

/**
 * GET /api/inventory/:id
 */
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

/**
 * POST /api/inventory
 */
const createProduct = async (req, res) => {
  try {
    const product = new Product(req.validatedBody);
    await product.save();
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

/**
 * PUT /api/inventory/:id
 */
const updateProduct = async (req, res) => {
  try {
    const existing = await Product.findById(req.params.id).lean();
    if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

    const merged = { ...existing, ...req.validatedBody };
    if (merged.price < merged.cost) {
      return res.status(400).json({ success: false, message: 'Price cannot be lower than cost' });
    }

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.validatedBody, lastUpdated: new Date() },
      { new: true, runValidators: true }
    ).lean();

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'SKU already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

/**
 * DELETE /api/inventory/:id
 */
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

module.exports = { getInventory, getProductById, createProduct, updateProduct, deleteProduct };
