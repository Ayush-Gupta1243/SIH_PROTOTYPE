const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const helmet = require("helmet");
const auditLogger = require("./middleware/audit");
const {
    validateCitizenId
} = require("./middleware/validation");
const checkCitizenOwnership = require("./middleware/ownership");
const authenticate = require("./middleware/auth");
const allowRoles = require("./middleware/rbac");
const rateLimit = require("express-rate-limit");
const {
    submitHousingApplication
} = require("./services/applicationService");
const {
    getApplicationById,
    getApplicationsByCitizen,
    getApplicationsByOfficerRole,
    updateApplicationDecision
} = require("./services/applicationStore");

const cors = require("cors");
const app = express();
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use(auditLogger);

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        message: "Too many requests, please try again later"
    }
});

app.use("/api", apiLimiter);
// ================================
// Demo Login
// ================================

app.post("/auth/login", (req, res) => {

    const { citizenId, role } = req.body;

    if (!citizenId || !role) {
        return res.status(400).json({
            message: "citizenId and role are required"
        });
    }

    const token = jwt.sign(
        {
            citizenId,
            role
        },
        process.env.JWT_SECRET || "govconnect-development-secret",
        {
            expiresIn: "1h"
        }
    );

    res.json({
        message: "Login successful",
        token
    });
});

// ======================================================================================
app.post(
    "/api/housing/apply",
    authenticate,
    allowRoles("citizen"),
    async (req, res) => {

        try {

            const {
                citizenId,
                name,
                dateOfBirth,
                mobile,
                address
            } = req.body;

            // Citizen can only submit for themselves
            if (req.user.citizenId !== citizenId) {
                return res.status(403).json({
                    message: "You can only apply for yourself"
                });
            }

            // Basic required-field validation
            if (
                !citizenId ||
                !name ||
                !dateOfBirth ||
                !mobile ||
                !address
            ) {
                return res.status(400).json({
                    message: "All required fields must be provided"
                });
            }

            const result =
                await submitHousingApplication({
                    citizenId,
                    name,
                    dateOfBirth,
                    mobile,
                    address
                });

            res.status(201).json({
                message: "Housing application submitted",
                ...result
            });

        } catch (error) {

            console.error(
                "Housing application error:",
                error.message
            );

            res.status(502).json({
                message: "Unable to submit housing application"
            });
        }
    }
);

//================================================================================
app.get(
    "/api/applications/:applicationId",
    authenticate,
    async (req, res) => {

        const application =
            getApplicationById(
                req.params.applicationId
            );

        if (!application) {
            return res.status(404).json({
                message: "Application not found"
            });
        }

        // Citizen can only see their own application
        if (
            req.user.role === "citizen" &&
            application.citizenId !== req.user.citizenId
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        res.json(application);
    }
);
//====================================================================================
app.get(
    "/api/applications/citizen/:citizenId",
    authenticate,
    async (req, res) => {

        if (
            req.user.role === "citizen" &&
            req.user.citizenId !== req.params.citizenId
        ) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        const applications =
            getApplicationsByCitizen(
                req.params.citizenId
            );

        res.json({
            applications
        });
    }
);
//=============================================================
app.get(
    "/api/officer/applications",
    authenticate,
    allowRoles(
        "housing_officer",
        "income_officer",
        "land_officer",
        "admin"
    ),
    async (req, res) => {

        try {

            const applications =
                getApplicationsByOfficerRole(
                    req.user.role
                );

            res.json({
                applications
            });

        } catch (error) {

            console.error(
                "Officer application fetch error:",
                error.message
            );

            res.status(500).json({
                message: "Unable to fetch applications"
            });
        }
    }
);

//============================================================================
app.patch(
    "/api/officer/applications/:applicationId/decision",
    authenticate,
    allowRoles("housing_officer", "admin"),
    async (req, res) => {

        try {

            const { decision, reason } = req.body;

            if (
                decision !== "APPROVED" &&
                decision !== "REJECTED"
            ) {
                return res.status(400).json({
                    message:
                        "Decision must be APPROVED or REJECTED"
                });
            }

            const application =
                getApplicationById(
                    req.params.applicationId
                );

            if (!application) {
                return res.status(404).json({
                    message: "Application not found"
                });
            }

            if (
                application.status !== "UNDER_REVIEW"
            ) {
                return res.status(400).json({
                    message:
                        "Application has already been decided"
                });
            }

            const updatedApplication =
                updateApplicationDecision(
                    req.params.applicationId,
                    {
                        status: decision,
                        by: req.user.citizenId,
                        role: req.user.role,
                        reason
                    }
                );

            res.json({
                message:
                    `Application ${decision.toLowerCase()} successfully`,
                application: updatedApplication
            });

        } catch (error) {

            console.error(
                "Application decision error:",
                error.message
            );

            res.status(500).json({
                message:
                    "Unable to update application decision"
            });
        }
    }
);
// ================================
// Gateway Health Check
// ================================

app.get("/health", (req, res) => {
    res.json({
        service: "GovConnect API Gateway",
        status: "running"
    });
});

// ================================
// Housing API
// ================================
app.get(
    "/api/housing/:citizenId",
    authenticate,
    allowRoles("citizen", "housing_officer", "admin"),
    validateCitizenId,
    checkCitizenOwnership,
    async (req, res) => {

        try {

            const response = await axios.get(
                `http://localhost:5001/api/housing/${req.params.citizenId}`
            );

            const housing = response.data;

res.json({
    citizenId: housing.citizenId,
    applicationId: housing.applicationId,
    status: housing.status,
    houseType: housing.houseType
});

        } catch (error) {

            console.error("Housing service error:", error.message);

            res.status(502).json({
                message: "Housing service unavailable"
            });
        }
    }
);
// ================================
// Income API
// ================================
app.get(
    "/api/income/:citizenId",
    authenticate,
    allowRoles("citizen", "income_officer", "admin"),
    validateCitizenId,
    checkCitizenOwnership,
    async (req, res) => {

        try {

            const response = await axios.get(
                `http://localhost:5002/api/income/${req.params.citizenId}`
            );

            const income = response.data;

res.json({
    citizenId: income.citizenId,
    annualIncome: income.annualIncome,
    category: income.category
});

        } catch (error) {

            console.error("Income service error:", error.message);

            res.status(502).json({
                message: "Income service unavailable"
            });
        }
    }
);

// ================================
// Land API
// ================================

app.get(
    "/api/land/:citizenId",
    authenticate,
    allowRoles("citizen", "land_officer", "admin"),
    validateCitizenId,
    checkCitizenOwnership,
    async (req, res) => {


        try {

            const response = await axios.get(
                `http://localhost:5003/api/land/${req.params.citizenId}`
            );

            const land = response.data;

res.json({
    citizenId: land.citizenId,
    ownsLand: land.ownsLand,
    landArea: land.landArea
});

        } catch (error) {

            console.error("Land service error:", error.message);

            res.status(502).json({
                message: "Land service unavailable"
            });
        }
    }
);
// ================================
// Housing Eligibility
// ================================

app.get(
    "/api/housing/eligibility/:citizenId",
    authenticate,
    allowRoles("citizen", "housing_officer", "admin"),
    validateCitizenId,
    checkCitizenOwnership,
    async (req, res) => {
        try {

            const citizenId = req.params.citizenId;

            const [incomeResponse, landResponse] =
                await Promise.all([

                    axios.get(
                        `http://localhost:5002/api/income/${citizenId}`
                    ),

                    axios.get(
                        `http://localhost:5003/api/land/${citizenId}`
                    )

                ]);

            const income = incomeResponse.data;
            const land = landResponse.data;

            const eligible =
                income.annualIncome <= 300000 &&
                land.ownsLand === false;

            res.json({
                citizenId,
                eligible,
                reason: eligible
                    ? "Eligibility criteria satisfied"
                    : "Eligibility criteria not satisfied"
            });

        } catch (error) {

            console.error(
                "Eligibility service error:",
                error.message
            );

            res.status(502).json({
                message: "Unable to verify eligibility"
            });
        }
    }
);

// ================================
// Start Gateway
// ================================

const PORT = 5000;

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
});
