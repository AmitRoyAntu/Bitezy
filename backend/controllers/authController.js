const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Buyer, Seller } = require('../models/User');
const Provider = require('../models/Provider');

// POST /api/auth/register (Public)
const registerUser = async (req, res) => {
    try {
        const { 
            name, email, password, phone, role, 
            buyerType, cuetId, department, residence, 
            shopName, location, description, openTime, closeTime,
            type, deliveryTime, img 
        } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ message: 'Please add all required fields' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let user;
        if (role === 'seller') {
            user = await Seller.create({
                name, email, phone,
                password: hashedPassword,
                role: 'seller'
            });

            const isOpen = calculateIsOpen(openTime, closeTime);
            await Provider.create({
                name: shopName || `${name}'s Shop`,
                seller: user._id,
                location: location || '',
                description: description || '',
                type: type || 'Canteen',
                deliveryTime: deliveryTime || '',
                img: img || '',
                openTime: openTime || '',
                closeTime: closeTime || '',
                isOpen: isOpen,
                rating: 0
            });
        } else {
            user = await Buyer.create({
                name, email, phone,
                password: hashedPassword,
                role: role || 'buyer',
                buyerType, cuetId, department, residence
            });
        }

        if (user) {
            return res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                // These will be returned based on the discriminator
                ...(user.role === 'buyer' ? {
                    residence: user.residence,
                    buyerType: user.buyerType,
                    cuetId: user.cuetId,
                    department: user.department
                } : {
                    shopName: shopName,
                }),
                token: generateToken(user._id),
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/login (Public)
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            let shopName = undefined;
            if (user.role === 'seller') {
                const provider = await Provider.findOne({ seller: user._id });
                shopName = provider ? provider.name : undefined;
            }

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
                shopName: shopName,
                token: generateToken(user._id),
            });
        } else {
            console.log(`Login attempt failed for: ${email}`);
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

// PUT /api/auth/profile (Private)
const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;

        if (user.role === 'buyer') {
            user.buyerType = req.body.buyerType || user.buyerType;
            user.cuetId = req.body.cuetId || user.cuetId;
            user.department = req.body.department || user.department;
            user.residence = req.body.residence || user.residence;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(req.body.password, salt);
        }

        const updatedUser = await user.save();

        // If user is a seller, sync with Provider info (Provider is now the source of truth)
        if (updatedUser.role === 'seller') {
            const provider = await Provider.findOne({ seller: updatedUser._id });
            const currentOpen = req.body.openTime || (provider ? provider.openTime : '08:00');
            const currentClose = req.body.closeTime || (provider ? provider.closeTime : '20:00');
            const isOpen = calculateIsOpen(currentOpen, currentClose);
            
            const providerFields = {
                name: req.body.shopName,
                location: req.body.location,
                description: req.body.description,
                openTime: req.body.openTime,
                closeTime: req.body.closeTime,
                type: req.body.type,
                deliveryTime: req.body.deliveryTime,
                img: req.body.img,
                isOpen: isOpen
            };

            Object.keys(providerFields).forEach(key => providerFields[key] === undefined && delete providerFields[key]);

            await Provider.findOneAndUpdate(
                { seller: updatedUser._id },
                { $set: providerFields },
                { upsert: true, new: true }
            );
        }

        const responseData = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            token: generateToken(updatedUser._id),
        };

        if (updatedUser.role === 'buyer') {
            responseData.residence = updatedUser.residence;
            responseData.buyerType = updatedUser.buyerType;
            responseData.cuetId = updatedUser.cuetId;
            responseData.department = updatedUser.department;
        } else if (updatedUser.role === 'seller') {
            const provider = await Provider.findOne({ seller: updatedUser._id });
            if (provider) {
                responseData.shopName = provider.name;
                responseData.location = provider.location;
                responseData.description = provider.description;
                responseData.openTime = provider.openTime;
                responseData.closeTime = provider.closeTime;
                responseData.type = provider.type;
                responseData.deliveryTime = provider.deliveryTime;
                responseData.img = provider.img;
                responseData.isOpen = provider.isOpen;
            }
        }

        return res.json(responseData);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/auth/me (Private)
const getMe = async (req, res) => {
    try {
        let user = await User.findById(req.user._id).select("-password").lean();
        if (user) {
            if (user.role === "seller") {
                const provider = await Provider.findOne({ seller: user._id }).lean();
                if (provider) {
                    user.shopName = provider.name;
                    user.location = provider.location;
                    user.description = provider.description;
                    user.openTime = provider.openTime;
                    user.closeTime = provider.closeTime;
                    user.type = provider.type;
                    user.deliveryTime = provider.deliveryTime;
                    user.img = provider.img;
                }
            }
            res.json(user);
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const calculateIsOpen = (openTime, closeTime) => {
    if (!openTime || !closeTime) return false;

    // Get current time in GMT+6
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const bdTime = new Date(utcTime + (3600000 * 6));
    
    const currentH = bdTime.getHours();
    const currentM = bdTime.getMinutes();
    const currentTime = currentH * 60 + currentM;

    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    // 22:00 → 05:00
    if (closeMinutes < openMinutes) {
        return currentTime >= openMinutes || currentTime < closeMinutes;
    }
    
    // 09:00 → 22:00
    return currentTime >= openMinutes && currentTime < closeMinutes;
};

module.exports = {
    registerUser,
    loginUser,
    updateProfile,
    getMe
};

