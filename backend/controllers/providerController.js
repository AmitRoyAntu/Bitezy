const Provider = require('../models/Provider');

// @desc    Get all providers
// @route   GET /api/providers
// @access  Public
const getProviders = async (req, res) => {
    try {
        const providers = await Provider.find({});
        res.json(providers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get provider by ID
// @route   GET /api/providers/:id
// @access  Public
const getProviderById = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id);
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get current seller's provider
// @route   GET /api/providers/myprovider
// @access  Private/Seller
const getMyProvider = async (req, res) => {
    try {
        const provider = await Provider.findOne({ seller: req.user._id });
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found for this seller' });
        }
        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProviders,
    getProviderById,
    getMyProvider,
};
