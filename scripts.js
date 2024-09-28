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

        if (!priceData || typeof priceData.c === 'undefined') {
            throw new Error(`Failed to retrieve current price for ${ticker}`);
        }

        const currentPrice = priceData.c;
        console.log('Current Price:', currentPrice);  // Log current price

          // Add the console log right here
        console.log('Current Price:', currentPrice);

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            throw new Error("No options data available.");
        }

        const firstOption = optionsData.data[0]; // First expiration date
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        // Extract strikes, calls, and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest || 0); // Fallback to 0 if undefined
        const putsOI = putOptions.map(option => option.openInterest || 0); // Fallback to 0 if undefined

        console.log('Strikes:', strikes);        // Log the strikes array
        console.log('Calls Open Interest:', callsOI);  // Log the calls open interest array
        console.log('Puts Open Interest:', putsOI);    // Log the puts open interest array

        // Prepare the chart data
        renderChart({ strikes, callsOI, putsOI }, currentPrice);

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    if (currentChart) {
        currentChart.destroy();
    }

    // Calculate the min and max strike price ranges for the chart
    const xMin = Math.max(Math.min(...data.strikes), currentPrice - 75);
    const xMax = Math.min(Math.max(...data.strikes), currentPrice + 75);
    console.log('X-axis Range:', { xMin, xMax });  // Log X-axis range

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes,
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                x: {
                    min: xMin,
                    max: xMax,
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        currentPriceLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: currentPrice,  // Ensure this is the actual current price
                            borderColor: 'rgba(0, 0, 0, 0.8)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice.toFixed(2)}`,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: '#fff'
                            }
                        }
                    }
                }
            }
        }
    });
}

// Increase canvas size to accommodate more data on the X-axis
const canvas = document.getElementById('optionsChart');
canvas.width = 1200;
canvas.height = 600;
