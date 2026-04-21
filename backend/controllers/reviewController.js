const Review = require('../models/Review');

// GET /api/reviews/provider/:providerId (Public)
const getProviderReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ provider: req.params.providerId })
            .populate('buyer', 'name')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// POST /api/reviews (Private)
const createReview = async (req, res) => {
    try {
        const { provider, rating, comment } = req.body;

        const review = await Review.create({
            provider,
            buyer: req.user._id,
            rating,
            comment,
        });

        // Populate buyer name before returning
        const populatedReview = await Review.findById(review._id).populate('buyer', 'name');
        res.status(201).json(populatedReview);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET /api/reviews (Private/Admin)
const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('buyer', 'name')
            .populate('provider', 'name')
            .sort('-createdAt');
        res.json(reviews);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProviderReviews,
    createReview,
    getAllReviews
};
