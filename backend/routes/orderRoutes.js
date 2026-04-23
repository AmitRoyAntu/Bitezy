const express = require('express');
const router = express.Router();
const { createOrder, getOrderById, updateOrderStatus, getMyOrders, getSellerOrders, getAllOrders } = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.post('/', protect, authorize('buyer'), createOrder);
router.get('/', protect, authorize('admin'), getAllOrders);
router.get('/myorders', protect, authorize('buyer'), getMyOrders);

router.get('/seller', protect, authorize('seller'), getSellerOrders);
router.get('/:id', protect, getOrderById);

router.put('/:id/status', protect, authorize('seller'), updateOrderStatus);

module.exports = router;
