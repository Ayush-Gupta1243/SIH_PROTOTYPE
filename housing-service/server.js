const express = require("express");

const app = express();

app.use(express.json());

// Test route
app.get("/health", (req, res) => {
    res.json({
        service: "Housing Department",
        status: "running"
    });
});

// Get housing information
app.get("/api/housing/:citizenId", (req, res) => {

    const citizenId = req.params.citizenId;

    // Temporary demo data
    const housingData = {
        citizenId: citizenId,
        applicationId: "HOUSE-" + citizenId,
        status: "Pending",
        houseType: "PMAY"
    };

    res.json(housingData);
});

app.post("/api/housing/apply", (req, res) => {

    const {
        citizenId,
        name,
        dateOfBirth,
        mobile,
        address
    } = req.body;

    if (
        !citizenId ||
        !name ||
        !dateOfBirth ||
        !mobile ||
        !address
    ) {
        return res.status(400).json({
            message: "Required housing application details missing"
        });
    }

    const applicationId =
        "HOUSE-" + Date.now();

    res.status(201).json({
        applicationId,
        citizenId,
        status: "SUBMITTED",
        message: "Housing application received"
    });
});

const PORT = 5001;

app.listen(PORT, () => {
    console.log(`Housing Service running on port ${PORT}`);
});