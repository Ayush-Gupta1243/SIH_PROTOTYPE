const axios = require("axios");

const {
    createApplication
} = require("./applicationStore");

async function submitHousingApplication(applicationData) {

    const {
        citizenId,
        name,
        dateOfBirth,
        mobile,
        address
    } = applicationData;


    // 1. Submit to Housing Department
    const housingResponse = await axios.post(
        "http://localhost:5001/api/housing/apply",
        {
            citizenId,
            name,
            dateOfBirth,
            mobile,
            address
        }
    );


    // 2. Verify income
    const incomeResponse = await axios.post(
        "http://localhost:5002/api/income/verify",
        {
            citizenId
        }
    );


    // 3. Verify land
    const landResponse = await axios.post(
        "http://localhost:5003/api/land/verify",
        {
            citizenId
        }
    );


    // 4. Create unified GovConnect application
    const application = createApplication({
        citizenId,
        name,
        dateOfBirth,
        mobile,
        address
    });


    // Update department states
    application.departments.income =
        incomeResponse.data.verified
            ? "VERIFIED"
            : "FAILED";

    application.departments.land =
        landResponse.data.verified
            ? "VERIFIED"
            : "FAILED";


    return {
        application,

        verification: {
            housing: housingResponse.data,
            income: incomeResponse.data,
            land: landResponse.data
        }
    };
}


module.exports = {
    submitHousingApplication
};