const API_BASE = "http://127.0.0.1:8000/api";

async function loadDashboard() {
    try {
        const [forecastResponse, inventoryResponse] = await Promise.all([
            fetch(`${API_BASE}/forecast?horizon=7`),
            fetch(`${API_BASE}/inventory`)
        ]);

        const forecast = await forecastResponse.json();
        const inventory = await inventoryResponse.json();

        document.getElementById("horizon").textContent = `${forecast.horizon} days`;
        document.getElementById("inventory-status").textContent = inventory.status;
        document.getElementById("reorder-point").textContent =
            inventory.reorder_point;

        document.getElementById("forecast-list").innerHTML =
            forecast.forecast
                .map(x => `<p>${x.date}: <strong>${x.predicted_sales}</strong></p>`)
                .join("");
    } catch (error) {
        console.error(error);
        document.getElementById("forecast-list").textContent =
            "Could not connect to the API.";
    }
}

loadDashboard();
