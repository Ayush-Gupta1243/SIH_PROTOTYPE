function checkCitizenOwnership(req, res, next) {

    if (!req.user) {
        return res.status(401).json({
            message: "Authentication required"
        });
    }

    // Officers and admins can access records according to their RBAC permissions
    if (
        req.user.role === "admin" ||
        req.user.role.endsWith("_officer")
    ) {
        return next();
    }

    // Citizens can only access their own record
    if (
        req.user.role === "citizen" &&
        req.user.citizenId !== req.params.citizenId
    ) {
        return res.status(403).json({
            message: "You can only access your own records"
        });
    }

    next();
}

module.exports = checkCitizenOwnership;