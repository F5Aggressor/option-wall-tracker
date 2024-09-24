let currentChart = null; // Store the chart instance

async function getOptionsData() {
    const ticker = document.getElementById('stockTicker').value;
    if (!ticker) {
        alert('Please enter a stock ticker symbol!');
        return;
    }

    const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10'; // Your Finnhub API key

    try {
        // Fetch stock price from Finnhub.io
        console.log("Fetching stock price...");
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();
        console.log("Stock Price Response:", priceData);
        if (!priceData || !priceData.c) {
            throw new Error("Failed to retrieve stock price data.");
        }
        const currentPrice = priceData.c;
        console.log('Current Price:', currentPrice);

        // Fetch options chain from Finnhub.io
        console.log("Fetching options chain...");
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();
        console.log("Options Chain Response:", optionsData);

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return; // Stop further processing if no options data
        }

        // Extracting CALL and PUT options for the first expiration date
        const firstOption = optionsData.data[0]; // First expiration date's options
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        console.log("Call Options Full Data:", callOptions);
        console.log("Put Options Full Data:", putOptions);

        // Generate strikes 50 points below and above the current price
        const minStrike = Math.floor((currentPrice - 50) / 5) * 5; // Ensure strikes are multiples of 5
        const maxStrike = Math.ceil((currentPrice + 50) / 5) * 5;
        const strikeRange = [];

        for (let strike = minStrike; strike <= maxStrike; strike += 2.5) {
            strikeRange.push(strike); // Push strikes in 2.5 increments
        }

        console.log(`Strike Range (from ${minStrike} to ${maxStrike}):`, strikeRange);

        // Map strikes with calls and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        console.log("Available Strikes from API:", strikes);

        // Initialize arrays for calls and puts open interest with 0 values
        const chartCallsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? callsOI[index] : 0;
        });

        const chartPutsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? putsOI[index] : 0;
        });

        console.log("Chart Calls Open Interest:", chartCallsOI);
        console.log("Chart Puts Open Interest:", chartPutsOI);

        // Generate chart data
        const chartData = {
            strikes: strikeRange, // Use the full strike range
            callsOI: chartCallsOI, // Calls OI mapped to strike range
            putsOI: chartPutsOI // Puts OI mapped to strike range
        };

        renderChart(chartData, currentPrice);
    } catch (error) {
        console.error('Error fetching data from Finnhub.io:', error);
        alert(`Error: ${error.message}`);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    // Destroy the old chart instance if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Create a new chart instance with a broader X-axis range and larger canvas
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes, // Strike prices dynamically filtered based on current price
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)', // Light blue for calls
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)', // Light red for puts
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: false, // Show strike prices based on dynamic range
                },
                y: {
                    beginAtZero: true // Bars start from 0
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: currentPrice,
                            yMax: currentPrice,
                            borderColor: 'rgba(0, 0, 0, 0.5)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice}`,
                                position: 'end',
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                padding: 6
                            }
                        }
                    }
                }
            }
        }
    });
}

// Simple test to verify Chart.js is working
document.addEventListener('DOMContentLoaded', (event) => {
    const ctx = document.getElementById('optionsChart').getContext('2d');
    const testChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Test 1', 'Test 2', 'Test 3'],
            datasets: [{
                label: 'Test Data',
                data: [10, 20, 30],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});
