const { param, validationResult } = require("express-validator");

const validateCitizenId = [
    param("citizenId")
        .trim()
        .matches(/^CIT[0-9]{3,10}$/)
        .withMessage("Invalid citizenId format"),

    (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                message: "Invalid request",
                errors: errors.array()
            });
        }

        next();
    }
];

module.exports = {
    validateCitizenId
};