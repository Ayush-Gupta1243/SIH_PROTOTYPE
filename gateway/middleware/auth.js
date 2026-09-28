const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {

    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    // Expected format:
    // Authorization: Bearer TOKEN

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({
            message: "Invalid authorization format"
        });
    }

    const token = parts[1];

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user information in request
        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}

module.exports = authenticate;