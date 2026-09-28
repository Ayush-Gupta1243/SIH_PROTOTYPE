const express = require("express");

const app = express();

app.use(express.json());

// Demo land records
const landRecords = [
    {
        citizenId: "CIT001",
        ownsLand: false,
        landArea: 0
    },
    {
        citizenId: "CIT002",
        ownsLand: true,
        landArea: 2.5
    },
    {
        citizenId: "CIT003",
        ownsLand: false,
        landArea: 0
    }
];

// Health check
app.get("/health", (req, res) => {
    res.json({
        service: "Land Department",
        status: "running"
    });
});

// Get land information
app.get("/api/land/:citizenId", (req, res) => {

    const citizenId = req.params.citizenId;

    const record = landRecords.find(
        item => item.citizenId === citizenId
    );

    if (!record) {
        return res.status(404).json({
            message: "Land record not found"
        });
    }

    res.json(record);
});

app.post("/api/land/verify", (req, res) => {

    const { citizenId } = req.body;

    if (!citizenId) {
        return res.status(400).json({
            message: "citizenId is required"
        });
    }

    const record = landRecords.find(
        item => item.citizenId === citizenId
    );

    if (!record) {
        return res.status(404).json({
            message: "Land record not found"
        });
    }

    res.json({
        citizenId,
        verified: true,
        ownsLand: record.ownsLand,
        landArea: record.landArea
    });
});

const PORT = 5003;

app.listen(PORT, () => {
    console.log(`Land Service running on port ${PORT}`);
});