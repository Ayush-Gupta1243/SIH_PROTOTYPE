const express = require("express");

const app = express();

app.use(express.json());

// Demo income records
const incomeRecords = [
    {
        citizenId: "CIT001",
        annualIncome: 250000,
        category: "EWS"
    },
    {
        citizenId: "CIT002",
        annualIncome: 600000,
        category: "General"
    },
    {
        citizenId: "CIT003",
        annualIncome: 180000,
        category: "EWS"
    }
];

// Health check
app.get("/health", (req, res) => {
    res.json({
        service: "Income Department",
        status: "running"
    });
});

// Get income information
app.get("/api/income/:citizenId", (req, res) => {

    const citizenId = req.params.citizenId;

    const record = incomeRecords.find(
        item => item.citizenId === citizenId
    );

    if (!record) {
        return res.status(404).json({
            message: "Income record not found"
        });
    }

    res.json(record);
});

app.post("/api/income/verify", (req, res) => {

    const { citizenId } = req.body;

    if (!citizenId) {
        return res.status(400).json({
            message: "citizenId is required"
        });
    }

    const record = incomeRecords.find(
        item => item.citizenId === citizenId
    );

    if (!record) {
        return res.status(404).json({
            message: "Income record not found"
        });
    }

    const verified =
        record.annualIncome <= 300000;

    res.json({
        citizenId,
        verified,
        annualIncome: record.annualIncome,
        category: record.category
    });
});

const PORT = 5002;

app.listen(PORT, () => {
    console.log(`Income Service running on port ${PORT}`);
});