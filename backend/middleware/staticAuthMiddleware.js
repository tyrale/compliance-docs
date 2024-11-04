const express = require('express');
const path = require('path');

const staticAuthMiddleware = (req, res, next) => {
    // Ensure user is authenticated before serving static files
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized to access files' });
    }
    next();
};

// Export both the middleware and a function to create the static middleware
module.exports = {
    staticAuthMiddleware,
    createStaticMiddleware: () => {
        return express.static(path.join(__dirname, '..', 'uploads'), {
            setHeaders: (res, filepath) => {
                // Set appropriate headers for PDF files
                if (filepath.endsWith('.pdf')) {
                    res.set('Content-Type', 'application/pdf');
                }
            }
        });
    }
};
