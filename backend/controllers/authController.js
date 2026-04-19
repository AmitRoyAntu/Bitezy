const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, role, buyerType, cuetId, department, residence, shopName, location, description, openTime, closeTime } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            name, email, phone,
            password: hashedPassword,
            role: role || 'buyer',
            buyerType, cuetId, department, residence,
            shopName, location, description, openTime, closeTime
        });

        if (user) {
            return res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                residence: user.residence,
                buyerType: user.buyerType,
                cuetId: user.cuetId,
                department: user.department,
                shopName: user.shopName,
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            return res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                residence: user.residence,
                buyerType: user.buyerType,
                cuetId: user.cuetId,
                department: user.department,
                shopName: user.shopName,
                token: generateToken(user._id),
            });
        } else {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.buyerType = req.body.buyerType || user.buyerType;
        user.cuetId = req.body.cuetId || user.cuetId;
        user.department = req.body.department || user.department;
        user.residence = req.body.residence || user.residence;
        user.shopName = req.body.shopName || user.shopName;
        user.location = req.body.location || user.location;
        user.description = req.body.description || user.description;
        user.openTime = req.body.openTime || user.openTime;
        user.closeTime = req.body.closeTime || user.closeTime;

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        return res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            residence: updatedUser.residence,
            buyerType: updatedUser.buyerType,
            shopName: updatedUser.shopName,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    getMe
};

