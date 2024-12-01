async function populateGraph() {
    const ticker = document.getElementById("stock-ticker").value.toUpperCase();
    const stopLoss = parseFloat(document.getElementById("stop-loss").value);
    const riskReward = parseFloat(document.getElementById("risk-reward").value);

    if (!ticker || isNaN(stopLoss) || isNaN(riskReward)) {
        alert("Please ensure all fields are correctly filled out.");
        return;
    }

    try {
        // Clear previous chart instance
        if (currentChart) {
            currentChart.destroy();
        }

        // Fetch stock price
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();
        const stockPrice = priceData.c;

        if (!stockPrice) {
            alert("Invalid stock data. Please check the ticker symbol.");
            return;
        }

        document.getElementById("stock-price").value = stockPrice.toFixed(2);

        // Generate graph data
        const labels = ["Day -3", "Day -2", "Day -1", "Today", "Day +1", "Day +2", "Day +3"];
        const prices = [
            stockPrice * 0.95,
            stockPrice * 0.97,
            stockPrice * 0.99,
            stockPrice,
            stockPrice * 1.02,
            stockPrice * 1.03,
            stockPrice * 1.05,
        ];
        const targetPrice = (stockPrice - stopLoss) * riskReward + stockPrice;

        const ctx = document.getElementById("stockGraph").getContext("2d");
        currentChart = new Chart(ctx, {
            type: "line",
            data: {
                labels,
                datasets: [
                    { label: `${ticker} Stock Price`, data: prices, borderColor: "blue", fill: false },
                    { label: "Stop Loss", data: Array(prices.length).fill(stopLoss), borderColor: "red", borderDash: [5, 5], fill: false },
                    { label: "Target Price", data: Array(prices.length).fill(targetPrice), borderColor: "green", borderDash: [5, 5], fill: false },
                ],
            },
            options: { responsive: true, scales: { x: { title: { display: true, text: "Days" } }, y: { title: { display: true, text: "Price (USD)" } } } },
        });
    } catch (error) {
        console.error("Error fetching data or rendering chart:", error);
        alert("An error occurred. Please try again later.");
    }
}


