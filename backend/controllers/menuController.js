const MenuItem = require('../models/MenuItem');
const Provider = require('../models/Provider');

// GET /api/menu (Public)
const getMenuItems = async (req, res) => {
    try {
        const vendorId = req.query.vendor;
        const availableOnly = req.query.available === 'true';
        
        const query = vendorId ? { provider: vendorId } : {};
        if (availableOnly) {
            query.available = true;
        }
        
        const items = await MenuItem.find(query);
        res.json(items);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/menu/:id (Public)
const getMenuItemById = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(item);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/menu (Private/Seller)
const createMenuItem = async (req, res) => {
    try {
        const { name, category, price, desc, img } = req.body;
        
        // Find the provider associated with this seller
        const provider = await Provider.findOne({ seller: req.user._id });
        
        if (!provider) {
            return res.status(400).json({ message: 'No provider associated with this seller' });
        }

        const item = await MenuItem.create({
            name, 
            category, 
            price, 
            desc, 
            img, 
            available: true, 
            provider: provider._id
        });
        
        res.status(201).json(item);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// PUT /api/menu/:id (Private/Seller)
const updateMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Security: Check if seller owns the provider for this item
        const provider = await Provider.findOne({ seller: req.user._id });
        if (!provider || item.provider.toString() !== provider._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this item' });
        }

        const updatedItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedItem);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// DELETE /api/menu/:id (Private/Seller)
const deleteMenuItem = async (req, res) => {
    try {
        const item = await MenuItem.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        // Security: Check if seller owns the provider for this item
        const provider = await Provider.findOne({ seller: req.user._id });
        if (!provider || item.provider.toString() !== provider._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        await MenuItem.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item removed successfully' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMenuItems,
    getMenuItemById,
    createMenuItem,
    updateMenuItem,
    deleteMenuItem,
};

