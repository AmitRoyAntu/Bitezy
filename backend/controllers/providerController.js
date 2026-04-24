const Provider = require('../models/Provider');

// GET /api/providers (Public)
const getProviders = async (req, res) => {
    try {
        const providers = await Provider.find({}).populate('seller', 'phone');
        res.json(providers);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/providers/:id (Public)
const getProviderById = async (req, res) => {
    try {
        const provider = await Provider.findById(req.params.id).populate('seller', 'phone');
        if (!provider) {
            return res.status(404).json({ message: 'Provider not found' });
        }
        res.json(provider);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/providers/myprovider (Private/Seller)
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
