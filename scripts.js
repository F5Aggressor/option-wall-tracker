let currentChart = null; // Store the chart instance

async function getOptionsData() {
    const ticker = document.getElementById('stockTicker').value;
    if (!ticker) {
        alert('Please enter a stock ticker symbol!');
        return;
    }

    const apiKey = 'crpflppr01qsek0flv0gcrpflppr01qsek0flv10'; // Your Finnhub API key

    try {
        // Clear previous chart instance
        if (currentChart) {
            currentChart.destroy();
        }

        // Fetch stock price from Finnhub.io
        const priceResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const priceData = await priceResponse.json();
        console.log('Price Data:', priceData);
        if (!priceData || !priceData.c) {
            throw new Error("Failed to retrieve stock price data.");
        }
        const currentPrice = priceData.c;

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        console.log('Raw Options Response:', optionsResponse); // Log raw response before parsing

        const optionsData = await optionsResponse.json(); // Parse JSON data
        console.log('Parsed Options Data:', optionsData); // Log parsed JSON data

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return;
        }

        const firstOption = optionsData.data[0]; // First expiration date's options
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        // Extract strikes, calls open interest, and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        // Get the min and max strike prices dynamically, limit to a range around current price
        const minStrike = Math.max(Math.floor(currentPrice - 50), Math.min(...strikes));
        const maxStrike = Math.min(Math.ceil(currentPrice + 50), Math.max(...strikes));

        // Filter strikes within a 50-point range around the current price
        const limitedStrikes = strikes.filter(strike => strike >= minStrike && strike <= maxStrike);

        // Ensure calls and puts open interest arrays match the limited strikes
        const limitedCallsOI = limitedStrikes.map(strike => {
            const index = strikes.indexOf(strike);
            return index > -1 ? callsOI[index] : 0;
        });
        const limitedPutsOI = limitedStrikes.map(strike => {
            const index = strikes.indexOf(strike);
            return index > -1 ? putsOI[index] : 0;
        });

        // Generate chart data
        const chartData = {
            strikes: limitedStrikes,
            callsOI: limitedCallsOI,
            putsOI: limitedPutsOI
        };

        renderChart(chartData, currentPrice);

        // Clear the stock ticker input after fetching data
        document.getElementById('stockTicker').value = '';

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
            labels: data.strikes, // Filtered strike prices within a limited range
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)', // Light blue for calls
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1,
                    categoryPercentage: 0.5, // Reduce overall category width to prevent overlap
                    barPercentage: 0.8 // Reduce individual bar width within the category
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)', // Light red for puts
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: false, // Show strike prices dynamically
                    ticks: {
                        autoSkip: true, // Auto-skip some labels to prevent overlap
                        maxRotation: 45, // Rotate the labels for better fit
                        minRotation: 45
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
                            scaleID: 'x',
                            value: currentPrice, // Align the line to the exact current price
                            borderColor: 'rgba(0, 0, 0, 0.8)', // Black line for current price
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice.toFixed(2)}`, // Bubble with price
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                position: 'end', // Position the label at the bottom of the chart
                                padding: 6,
                                xAdjust: 0, // Place the label right on the line
                                yAdjust: 20 // Adjust placement so it's below the chart area
                            }
                        }
                    }
                }
            },
            layout: {
                padding: {
                    right: 50 // Extra space for the vertical line
                }
            }
        }
    });
}

// Increase canvas size to accommodate more data on the X-axis
const canvas = document.getElementById('optionsChart');
canvas.width = 1000; // Adjust as needed for larger size
canvas.height = 500; // Adjust height as needed
