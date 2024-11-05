const devAuth = (req, res, next) => {
    // Set a mock user for development
    req.user = {
        _id: '507f1f77bcf86cd799439011', // Mock MongoDB ObjectId
        name: 'Development User',
        email: 'dev@example.com',
        role: 'admin'
    };
    next();
};

module.exports = { devAuth };
