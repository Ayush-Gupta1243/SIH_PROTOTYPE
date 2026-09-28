const API_URL = "http://localhost:5000";


// ================================
// Login
// ================================

async function login() {

    const citizenId =
        document.getElementById("loginCitizenId").value.trim();

    const role =
        document.getElementById("loginRole").value;

    if (!citizenId) {
        showResult({
            message: "Please enter Citizen ID"
        });

        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    citizenId,
                    role
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Login failed"
            );
        }

        sessionStorage.setItem(
            "accessToken",
            data.token
        );

        sessionStorage.setItem(
            "citizenId",
            citizenId
        );

        document.getElementById(
            "displayCitizenId"
        ).textContent = citizenId;

        document.getElementById(
            "loginSection"
        ).style.display = "none";

        document.getElementById(
            "dashboardSection"
        ).style.display = "block";

    } catch (error) {

        showResult({
            message: error.message
        });

    }
}


// ================================
// API Request Helper
// ================================

async function apiRequest(endpoint, options = {}) {

    const token =
        sessionStorage.getItem("accessToken");

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",

                ...(options.headers || {}),

                Authorization: `Bearer ${token}`
            }
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Request failed"
        );
    }

    return data;
}

// ================================
// Housing
// ================================

async function getHousing() {

    const citizenId =
        sessionStorage.getItem("citizenId");

    try {

        const data = await apiRequest(
            `${API_URL}/api/housing/${citizenId}`
        );

        showResult(data);

    } catch (error) {

        showResult(error.message);
    }
}


// ================================
// Income
// ================================

async function getIncome() {

    const citizenId =
        sessionStorage.getItem("citizenId");

    try {

        const data = await apiRequest(
            `${API_URL}/api/income/${citizenId}`
        );

        showResult(data);

    } catch (error) {

        showResult(error.message);
    }
}


// ================================
// Land
// ================================

async function getLand() {

    const citizenId =
        sessionStorage.getItem("citizenId");

    try {

        const data = await apiRequest(
            `${API_URL}/api/land/${citizenId}`
        );

        showResult(data);

    } catch (error) {

        showResult(error.message);
    }
}


// ================================
// Eligibility
// ================================

async function checkEligibility() {

    const citizenId =
        sessionStorage.getItem("citizenId");

    try {

        const data = await apiRequest(
            `${API_URL}/api/housing/eligibility/${citizenId}`
        );

        showResult(data);

    } catch (error) {

        showResult(error.message);
    }
}


// ================================
// UI
// ================================

function showDashboard() {

    document.getElementById("loginSection").hidden = true;

    document.getElementById("dashboardSection").hidden = false;
}


function showResult(data) {

    document.getElementById("result").textContent =
        typeof data === "object"
            ? JSON.stringify(data, null, 2)
            : data;
}


// ================================
// Logout
// ================================

function logout() {

    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("citizenId");

    document.getElementById("loginSection").hidden = false;
    document.getElementById("dashboardSection").hidden = true;

    document.getElementById("result").textContent = "";
}


// =============================================
async function applyForHousing() {

    const citizenId =
        sessionStorage.getItem("citizenId");

    const name =
        document.getElementById("name").value.trim();

    const dateOfBirth =
        document.getElementById("dateOfBirth").value;

    const mobile =
        document.getElementById("mobile").value.trim();

    const address =
        document.getElementById("address").value.trim();


    if (
        !name ||
        !dateOfBirth ||
        !mobile ||
        !address
    ) {
        showResult(
            "Please complete all profile details."
        );

        return;
    }


    try {

        const response = await apiRequest(
            "/api/housing/apply",
            {
                method: "POST",

                body: JSON.stringify({
                    citizenId,
                    name,
                    dateOfBirth,
                    mobile,
                    address
                })
            }
        );


        showResult(response);


        // Automatically refresh applications
        loadApplications();

    } catch (error) {

        showResult({
            message: error.message
        });

    }
}

//====================================================
async function loadApplications() {

    const citizenId =
        sessionStorage.getItem("citizenId");


    try {

        const response = await apiRequest(
            `/api/applications/citizen/${citizenId}`
        );


        const container =
            document.getElementById("applications");


        if (
            !response.applications ||
            response.applications.length === 0
        ) {

            container.innerHTML =
                "<p>No applications found.</p>";

            return;
        }


        container.innerHTML =
            response.applications
                .map(application => {

                    return `
                        <div class="application-card">

                            <h4>
                                ${application.applicationId}
                            </h4>

                            <p>
                                <strong>Status:</strong>
                                ${application.status}
                            </p>

                            <p>
                                <strong>Housing:</strong>
                                ${application.departments.housing}
                            </p>

                            <p>
                                <strong>Income:</strong>
                                ${application.departments.income}
                            </p>

                            <p>
                                <strong>Land:</strong>
                                ${application.departments.land}
                            </p>

                            ${
                                application.decision
                                ? `
                                    <p>
                                        <strong>Decision:</strong>
                                        ${application.decision.status}
                                    </p>

                                    <p>
                                        <strong>Reason:</strong>
                                        ${application.decision.reason || "N/A"}
                                    </p>
                                `
                                : `
                                    <p>
                                        <strong>Decision:</strong>
                                        Pending officer review
                                    </p>
                                `
                            }

                        </div>
                    `;

                })
                .join("");

    } catch (error) {

        showResult({
            message: error.message
        });

    }
}