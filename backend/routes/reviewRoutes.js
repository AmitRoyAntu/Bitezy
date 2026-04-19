const express = require('express');
const router = express.Router();
const { getProviderReviews, createReview, getAllReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', protect, authorize('admin'), getAllReviews);
router.get('/provider/:providerId', getProviderReviews);
router.post('/', protect, createReview);


module.exports = router;
