const applications = [];

function createApplication(data) {

    const application = {
        applicationId: `GOV-HOUS-${Date.now()}`,

        citizenId: data.citizenId,

        citizen: {
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            mobile: data.mobile,
            address: data.address
        },

        status: "UNDER_REVIEW",

        departments: {
            housing: "SUBMITTED",
            income: "PENDING",
            land: "PENDING"
        },

        createdAt: new Date().toISOString(),

        decision: null
    };

    applications.push(application);

    return application;
}


function getApplicationById(applicationId) {

    return applications.find(
        application =>
            application.applicationId === applicationId
    );
}


function getApplicationsByCitizen(citizenId) {

    return applications.filter(
        application =>
            application.citizenId === citizenId
    );
}

function getApplicationsByOfficerRole(role) {

    if (role === "admin" || role === "housing_officer") {
        return applications;
    }

    if (role === "income_officer") {
        return applications.filter(
            application =>
                application.departments.income === "VERIFIED" ||
                application.departments.income === "PENDING"
        );
    }

    if (role === "land_officer") {
        return applications.filter(
            application =>
                application.departments.land === "VERIFIED" ||
                application.departments.land === "PENDING"
        );
    }

    return [];
}

function updateApplicationDecision(
    applicationId,
    decisionData
) {

    const application = applications.find(
        item => item.applicationId === applicationId
    );

    if (!application) {
        return null;
    }

    application.status = decisionData.status;

    application.decision = {
        status: decisionData.status,
        by: decisionData.by,
        role: decisionData.role,
        at: new Date().toISOString(),
        reason: decisionData.reason || null
    };

    return application;
}


module.exports = {
    createApplication,
    getApplicationById,
    getApplicationsByCitizen,
    getApplicationsByOfficerRole,
    updateApplicationDecision
};