let currentChart = null; // Store the chart instance

// Add event listener to execute when Enter key is pressed
document.getElementById('stockTicker').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        getOptionsData(); // Execute the function when Enter is pressed
    }
});

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
        if (!priceData || !priceData.c) {
            throw new Error("Failed to retrieve stock price data.");
        }
        const currentPrice = priceData.c;

        // Fetch options chain from Finnhub.io
        console.log("Fetching options chain...");
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return; 
        }

        // Extracting CALL and PUT options for the first expiration date
        const firstOption = optionsData.data[0]; // First expiration date's options
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        // Generate strikes 50 points below and above the current price
        const minStrike = Math.max(0, Math.floor((currentPrice - 50) / 5) * 5); // Ensure strikes are not below 0
        const maxStrike = Math.ceil((currentPrice + 50) / 5) * 5;
        const strikeRange = [];

        for (let strike = minStrike; strike <= maxStrike; strike += 1) { // Increment strikes by 1 for clarity
            strikeRange.push(strike);
        }

        // Map strikes with calls and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        // Initialize arrays for calls and puts open interest with 0 values
        const chartCallsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? callsOI[index] : 0;
        });

        const chartPutsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? putsOI[index] : 0;
        });

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

    // Find the closest strike price to the current price
    const closestStrikeIndex = data.strikes.reduce((prevIndex, currentStrike, currentIndex) => {
        return Math.abs(currentStrike - currentPrice) < Math.abs(data.strikes[prevIndex] - currentPrice)
            ? currentIndex
            : prevIndex;
    }, 0);

    // Create a new chart instance with a vertical line for the current stock price
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes, // Strike prices with increments of 1
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
                    beginAtZero: true, // Ensure x-axis does not go negative
                    ticks: {
                        stepSize: 1, // Ensure x-axis increments by 1
                    }
                },
                y: {
                    beginAtZero: true // Bars start from 0
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        currentPriceLine: {
                            type: 'line',
                            xMin: closestStrikeIndex, // Align vertical line to the closest strike index
                            xMax: closestStrikeIndex,
                            borderColor: 'rgba(0, 0, 0, 0.7)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `$${currentPrice}`, // Display only the price without "Current Price" text
                                position: 'start',
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

