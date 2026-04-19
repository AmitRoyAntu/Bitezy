const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUserStatus } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id/block', protect, authorize('admin'), updateUserStatus);

module.exports = router;
