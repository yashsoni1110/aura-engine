const Product = require('../models/Product');

/**
 * GET /api/analytics
 * Retrieve key metrics and breakdown stats for dashboard widgets.
 */
const getAnalytics = async (req, res) => {
  try {
    const aggregateOpts = { allowDiskUse: true };

    const [summaryResult, categoryValuation, restockPriority, outOfStock] = await Promise.all([

      // KPI Summary aggregation
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalSKUs: { $sum: 1 },
            totalInventoryValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
            outOfStockCount: { $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] } },
            avgPrice: { $avg: '$price' },
          },
        },
        {
          $project: {
            _id: 0,
            totalSKUs: 1,
            totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
            outOfStockCount: 1,
            avgPrice: { $round: ['$avgPrice', 2] },
          },
        },
      ], aggregateOpts),

      // Portfolio Distribution valuation
      Product.aggregate([
        {
          $group: {
            _id: '$category',
            totalValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
            skuCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            category: '$_id',
            totalValue: { $round: ['$totalValue', 2] },
            skuCount: 1,
          },
        },
        { $sort: { totalValue: -1 } },
      ], aggregateOpts),

      // Restock Priority list
      Product.aggregate([
        { $match: { stockQuantity: { $gt: 0 } } },
        { $sort: { stockQuantity: 1 } },
        { $limit: 10 },
        {
          $project: {
            _id: 1,
            productName: 1,
            sku: 1,
            stockQuantity: 1,
            reorderLevel: 1,
            category: 1,
          },
        },
      ], aggregateOpts),

      // Out-of-Stock list
      Product.aggregate([
        { $match: { stockQuantity: 0 } },
        { $sort: { lastUpdated: -1 } },
        { $limit: 20 },
        {
          $project: {
            _id: 1,
            productName: 1,
            sku: 1,
            category: 1,
            price: 1,
          },
        },
      ], aggregateOpts),
    ]);

    const summary = summaryResult[0] || {
      totalSKUs: 0,
      totalInventoryValue: 0,
      outOfStockCount: 0,
      avgPrice: 0,
    };

    res.json({
      success: true,
      data: {
        summary,
        categoryValuation,
        restockPriority,
        outOfStock,
      },
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
  }
};

module.exports = { getAnalytics };
