const express = require('express');
const router = express.Router();
const { getProviders, getProviderById, getMyProvider } = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.get('/', getProviders);
router.get('/myprovider', protect, authorize('seller'), getMyProvider);
router.get('/:id', getProviderById);

module.exports = router;
