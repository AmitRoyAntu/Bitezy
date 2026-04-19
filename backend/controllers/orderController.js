const Order = require('../models/Order');
const Provider = require('../models/Provider');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { provider, items, subtotal, deliveryFee, total, type, deliveryAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            customer: req.user._id,
            provider, 
            items, 
            subtotal, 
            deliveryFee, 
            total, 
            type, 
            deliveryAddress
        });

        const createdOrder = await order.save();
        res.status(201).json(createdOrder);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customer', 'name email')
            .populate('provider', 'name');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Seller/Admin
const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Security: If seller, check if they own the provider for this order
        if (req.user.role === 'seller') {
            const provider = await Provider.findOne({ seller: req.user._id });
            if (!provider || order.provider.toString() !== provider._id.toString()) {
                return res.status(403).json({ message: 'You are not authorized to update this order' });
            }
        }

        order.status = req.body.status || order.status;
        const updatedOrder = await order.save();
        res.json(updatedOrder);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id }).populate('provider', 'name');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get seller orders
// @route   GET /api/orders/seller
// @access  Private/Seller
const getSellerOrders = async (req, res) => {
    try {
        // Find provider for the current seller
        const provider = await Provider.findOne({ seller: req.user._id });
        
        if (!provider) {
            return res.json([]);
        }

        const orders = await Order.find({ provider: provider._id })
            .populate('customer', 'name residence')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders (Admin only)
// @route   GET /api/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customer', 'name residence')
            .populate('provider', 'name')
            .sort('-createdAt');
        res.json(orders);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getOrderById,
    updateOrderStatus,
    getMyOrders,
    getSellerOrders,
    getAllOrders
};
