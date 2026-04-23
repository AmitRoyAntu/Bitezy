const express = require('express');
const router = express.Router();
const { getMenuItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem } = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getMenuItems);
router.get('/:id', getMenuItemById);
router.post('/', protect, authorize('seller'), createMenuItem);
router.put('/:id', protect, authorize('seller'), updateMenuItem);
router.delete('/:id', protect, authorize('seller'), deleteMenuItem);


module.exports = router;
