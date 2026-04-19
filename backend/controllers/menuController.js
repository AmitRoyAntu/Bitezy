const MenuItem = require('../models/MenuItem');
const Provider = require('../models/Provider');

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
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

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
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

// @desc    Create menu item (Seller only)
// @route   POST /api/menu
// @access  Private/Seller
const createMenuItem = async (req, res) => {
    try {
        const { name, category, price, desc, img, available } = req.body;
        
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
            available: available !== undefined ? available : true, 
            provider: provider._id
        });
        
        res.status(201).json(item);
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Seller
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

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Seller
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

