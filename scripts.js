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
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();
        if (!priceData || !priceData.c) {
            throw new Error("Failed to retrieve stock price data.");
        }
        const currentPrice = priceData.c;

        // Fetch options chain from Finnhub.io for the nearest expiration date (one week out)
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();
        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return;
        }

        // Only use the first expiration date (typically one week out)
        const firstOption = optionsData.data[0]; // First expiration date's options
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        // Extract strikes, calls open interest, and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        // Set a dynamic range of 50 points above and below the current price to center the chart
        const minStrike = currentPrice - 50;
        const maxStrike = currentPrice + 50;

        // Filter strikes within this range
        const limitedStrikes = strikes.filter(strike => strike >= minStrike && strike <= maxStrike);

        // Ensure the calls and puts open interest are sliced to match the limited strikes
        const limitedCallsOI = callsOI.slice(0, limitedStrikes.length);
        const limitedPutsOI = putsOI.slice(0, limitedStrikes.length);

        // Generate chart data
        const chartData = {
            strikes: limitedStrikes,
            callsOI: limitedCallsOI,
            putsOI: limitedPutsOI
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

    // Create a new chart instance with proper annotation for the current price
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes, // Strike prices dynamically filtered based on current price
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)', // Light blue for calls
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    // Reduce the bar thickness
                    categoryPercentage: 0.5, // Reduce overall category width to prevent overlap
                    barPercentage: 0.8 // Reduce individual bar width within the category
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)', // Light red for puts
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    // Reduce the bar thickness
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
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
                        currentPriceLine: {
                            type: 'line',
                            xMin: currentPrice, // Show the line at the current price position
                            xMax: currentPrice,
                            borderColor: 'rgba(0, 0, 0, 0.8)', // Black line for current price
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice.toFixed(2)}`, // Bubble with price
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                position: 'center', // Center the label over the line
                                padding: 6,
                                xAdjust: -40, // Adjust label placement on the line
                                yAdjust: -20
                            }
                        }
                    }
                }
            }
        }
    });
}
