function allowRoles(...allowedRoles) {
    return (req, res, next) => {

        // Authentication should already have happened
        if (!req.user) {
            return res.status(401).json({
                message: "Authentication required"
            });
        }

        // Check user's role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
}

module.exports = allowRoles;