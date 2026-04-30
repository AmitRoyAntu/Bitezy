const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Buyer, Seller } = require('../models/User');
const Provider = require('../models/Provider');
const { sendMail } = require('../utils/mailer');

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
            // Generate a 6-digit OTP, save it with expiry (1 minute)
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otp;
            user.otpExpires = Date.now() + (1 * 60 * 1000); // 1 minute
            await user.save();

            // Try to send OTP via configured email provider. If not configured, fall back to console log.
            const mailOptions = {
                to: email,
                subject: 'Bitezy Security Code',
                text: `Your Bitezy verification code is ${otp}. It will expire in 1 minute.`,
                html: `
                <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; color: #0f583e;">bite<span style="color: #EE5253;">zy</span></h1>
                        <p style="color: #666; font-size: 14px; margin-top: 5px;">Your Hunger, Our Priority</p>
                    </div>
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                        <p style="margin: 0; color: #4b5563; font-size: 16px; font-weight: 500;">Your One-Time Password (OTP)</p>
                        <h2 style="margin: 15px 0; color: #111827; font-size: 36px; font-weight: 800; letter-spacing: 4px;">${otp}</h2>
                        <p style="margin: 0; color: #9ca3af; font-size: 13px;">This code expires in <span style="color: #dc2626; font-weight: 600;">1 minute</span></p>
                    </div>
                    <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                        <p>Hi there,</p>
                        <p>We received a request to sign in to your Bitezy account. Please use the verification code above to complete your login.</p>
                        <p style="color: #ef4444; font-weight: 500;">If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
                        <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; 2026 Bitezy Inc. • CUET, Chittagong</p>
                    </div>
                </div>
                `
            };

            try {
                const sent = await sendMail(mailOptions);
                if (sent) {
                    return res.json({ message: 'OTP sent. Verify to complete login.' });
                }
            } catch (mailErr) {
                console.error('Error sending OTP email:', mailErr.message || mailErr);
            }

            // Fallback: log OTP to server console when not configured or sending failed
            console.log(`OTP for ${email}: ${otp}`);

            return res.json({ message: 'OTP generated. (Email delivery not configured)' });
        }

        console.log(`Login attempt failed for: ${email}`);
        return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/verify-otp (Public)
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired or not requested' });
        }

        if (user.otpCode !== otp.toString()) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // Clear OTP fields
        user.otpCode = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Prepare response (include shopName for sellers)
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

// POST /api/auth/forgot-password (Public)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User with this email not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = Date.now() + (5 * 60 * 1000); // 5 minutes for password reset
        await user.save();

        const mailOptions = {
            to: email,
            subject: 'Bitezy Password Reset',
            text: `Your password reset code is ${otp}. It will expire in 5 minutes.`,
            html: `
            <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #0f583e;">bite<span style="color: #EE5253;">zy</span></h1>
                </div>
                <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; text-align: center; margin-bottom: 30px;">
                    <p style="margin: 0; color: #4b5563; font-size: 16px; font-weight: 500;">Your Password Reset Code</p>
                    <h2 style="margin: 15px 0; color: #111827; font-size: 36px; font-weight: 800; letter-spacing: 4px;">${otp}</h2>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px;">This code expires in <span style="color: #dc2626; font-weight: 600;">5 minutes</span></p>
                </div>
                <div style="color: #374151; font-size: 14px; line-height: 1.6;">
                    <p>Hi there,</p>
                    <p>We received a request to reset your Bitezy password. Please use the verification code above to complete your reset process.</p>
                </div>
            </div>
            `
        };

        try {
            const sent = await sendMail(mailOptions);
            if (sent) {
                return res.json({ message: 'Reset code sent to your email.' });
            }
        } catch (mailErr) {
            console.error('Error sending reset email:', mailErr.message || mailErr);
        }

        console.log(`Password reset OTP for ${email}: ${otp}`);
        return res.json({ message: 'Reset code generated. (Email delivery not configured)' });
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/auth/reset-password (Public)
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: 'Email, OTP, and new password are required' });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.otpCode || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'Reset code expired or not requested' });
        }

        if (user.otpCode !== otp.toString()) {
            return res.status(400).json({ message: 'Invalid reset code' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        user.otpCode = undefined;
        user.otpExpires = undefined;
        
        await user.save();

        let shopName = undefined;
        if (user.role === 'seller') {
            const provider = await Provider.findOne({ seller: user._id });
            shopName = provider ? provider.name : undefined;
        }

        return res.json({
            message: 'Password has been successfully reset',
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
        
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    verifyOtp,
    updateProfile,
    getMe,
    forgotPassword,
    resetPassword
};

