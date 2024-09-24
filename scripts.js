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

        // Extract strikes, calls open interest, and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        console.log("Strikes Extracted:", strikes);
        console.log("Calls Open Interest Extracted:", callsOI);
        console.log("Puts Open Interest Extracted:", putsOI);

        // Filter strikes to 5 above and 5 below the current price
        const limitedStrikes = strikes.filter(strike => Math.abs(strike - currentPrice) <= 5);
        console.log("Limited Strikes (around current price):", limitedStrikes);

        // Insert the current price into the middle of the strikes array
        const middleIndex = Math.floor(limitedStrikes.length / 2);
        limitedStrikes.splice(middleIndex, 0, currentPrice); // Insert current price at the center
        console.log("Strikes with current price centered:", limitedStrikes);

        // Ensure the calls and puts open interest is sliced to match the limited strikes
        const limitedCallsOI = callsOI.slice(0, limitedStrikes.length);
        const limitedPutsOI = putsOI.slice(0, limitedStrikes.length);

        console.log("Limited Calls Open Interest after slicing:", limitedCallsOI);
        console.log("Limited Puts Open Interest after slicing:", limitedPutsOI);

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

    // Create a new chart instance with the current price centered
    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes, // Strike prices (including current price in the middle)
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
                    beginAtZero: false, // Show strike prices around the current price
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
