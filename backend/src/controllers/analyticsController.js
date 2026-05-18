const Product = require('../models/Product');

/**
 * GET /api/analytics
 * Heavy MongoDB aggregation pipeline — never fetches all 50k docs to JS.
 *
 * All four pipelines run in Promise.all() for parallel execution.
 * allowDiskUse: true prevents the 100MB RAM limit error on large datasets.
 */
const getAnalytics = async (req, res) => {
  try {
    const aggregateOpts = { allowDiskUse: true };

    const [summaryResult, categoryValuation, restockPriority, outOfStock] = await Promise.all([

      // ── Widget 3: KPI Summary ────────────────────────────────────────────
      // $group over all docs in a single pass — no JS-side iteration needed
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

      // ── Widget 2: Portfolio Distribution (Pie Chart) ─────────────────────
      // Groups by category, sums price * stockQuantity for total valuation
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

      // ── Widget 1: Restock Priority (Bar Chart) ────────────────────────────
      // Top 10 lowest non-zero stock — $match first to use the index,
      // then $sort + $limit to avoid full-collection sort
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

      // ── Out-of-Stock Alert Panel ──────────────────────────────────────────
      // Returns up to 20 most recently-updated OOS items for the alert panel
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
