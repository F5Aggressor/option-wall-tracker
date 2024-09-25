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

        // Initialize combined data structures for open interest
        const combinedCallsOI = {};
        const combinedPutsOI = {};
        
        const sixMonthsLater = new Date();
        sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);

        // Loop through all expiration dates and combine open interest
        optionsData.data.forEach(optionChain => {
            const expirationDate = new Date(optionChain.expirationDate);

            // Only consider options expiring within 6 months
            if (expirationDate <= sixMonthsLater) {
                const callOptions = optionChain.options.CALL;
                const putOptions = optionChain.options.PUT;

                callOptions.forEach(option => {
                    const strike = option.strike;
                    if (!combinedCallsOI[strike]) {
                        combinedCallsOI[strike] = 0;
                    }
                    combinedCallsOI[strike] += option.openInterest; // Sum the open interest for calls
                });

                putOptions.forEach(option => {
                    const strike = option.strike;
                    if (!combinedPutsOI[strike]) {
                        combinedPutsOI[strike] = 0;
                    }
                    combinedPutsOI[strike] += option.openInterest; // Sum the open interest for puts
                });
            }
        });

        // Create arrays for strikes, calls open interest, and puts open interest
        const strikes = Object.keys(combinedCallsOI).sort((a, b) => a - b).map(Number);
        const callsOI = strikes.map(strike => combinedCallsOI[strike] || 0);
        const putsOI = strikes.map(strike => combinedPutsOI[strike] || 0);

        console.log("Aggregated Strikes:", strikes);
        console.log("Aggregated Calls Open Interest:", callsOI);
        console.log("Aggregated Puts Open Interest:", putsOI);

        // Generate chart data
        const chartData = {
            strikes: strikes, // Use the combined strike prices
            callsOI: callsOI, // Use the combined calls OI
            putsOI: putsOI // Use the combined puts OI
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

    // Create a new chart instance with the combined data
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


