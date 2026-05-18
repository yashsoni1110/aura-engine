const { z } = require('zod');

const productBaseSchema = z.object({
  productName: z
    .string({ required_error: 'Product name is required' })
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(200, 'Product name cannot exceed 200 characters'),

  sku: z
    .string({ required_error: 'SKU is required' })
    .trim()
    .min(1, 'SKU cannot be empty')
    .max(50, 'SKU cannot exceed 50 characters'),

  category: z.enum(
    [
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
    { required_error: 'Category is required', invalid_type_error: 'Invalid category' }
  ),

  price: z
    .number({ required_error: 'Price is required', invalid_type_error: 'Price must be a number' })
    .min(0, 'Price cannot be negative'),

  cost: z
    .number({ required_error: 'Cost is required', invalid_type_error: 'Cost must be a number' })
    .min(0, 'Cost cannot be negative'),

  stockQuantity: z
    .number({ invalid_type_error: 'Stock quantity must be a number' })
    .int('Stock quantity must be a whole number')
    .min(0, 'Stock quantity cannot be negative')
    .default(0),

  reorderLevel: z
    .number({ invalid_type_error: 'Reorder level must be a number' })
    .int('Reorder level must be a whole number')
    .min(0, 'Reorder level cannot be negative')
    .default(10),
});

// Full schema with cross-field validation for POST
const productSchema = productBaseSchema.refine((data) => data.price >= data.cost, {
  message: 'Price cannot be lower than cost',
  path: ['price'],
});

// Partial schema for PUT — validate cross-field only when both are present
const productUpdateSchema = productBaseSchema.partial().superRefine((data, ctx) => {
  if (data.price !== undefined && data.cost !== undefined && data.price < data.cost) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Price cannot be lower than cost',
      path: ['price'],
    });
  }
});

/**
 * Middleware factory for Zod schema validation
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }
  req.validatedBody = result.data;
  next();
};

module.exports = {
  validate,
  productSchema,
  productUpdateSchema,
};
