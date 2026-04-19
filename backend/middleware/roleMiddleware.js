const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: `User role (${req.user ? req.user.role : 'none'}) is not authorized` });
        }
        next();
    };
};

module.exports = { authorize };
