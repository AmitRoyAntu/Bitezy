const { User } = require('../models/User');

// GET /api/users (Private/Admin)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/users/:id (Private/Admin)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// PUT /api/users/:id/block (Private/Admin)
const updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isBlocked = req.body.isBlocked !== undefined ? req.body.isBlocked : user.isBlocked;
        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            isBlocked: updatedUser.isBlocked
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUserStatus,
};
