const { Router } = require('express');
const {
  getInventory,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/inventoryController');
const { validate, productSchema, productUpdateSchema } = require('../middleware/validate');

const router = Router();

router.get('/', getInventory);
router.get('/:id', getProductById);
router.post('/', validate(productSchema), createProduct);
router.put('/:id', validate(productUpdateSchema), updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
