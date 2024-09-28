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

        // Log the current price for debugging
        console.log('Current Price:', currentPrice);

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();

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

        console.log('Strikes:', strikes);
        console.log('Calls Open Interest:', callsOI);
        console.log('Puts Open Interest:', putsOI);

        const chartData = {
            strikes,
            callsOI,
            putsOI
        };

        renderChart(chartData, currentPrice);

        document.getElementById('stockTicker').value = ''; // Clear the input

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    // Destroy the previous chart if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Log annotation data
    console.log('Rendering vertical line at:', currentPrice);

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
                    borderWidth: 1,
                    categoryPercentage: 0.5,
                    barPercentage: 0.8
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
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
                    ticks: {
                        autoSkip: true,
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    beginAtZero: true
                }
            },
            plugins: {
                annotation: {
                    annotations: {
                        currentPriceLine: {
                            type: 'line',
                            scaleID: 'x',
                            value: currentPrice,  // Place the line exactly at the current price
                            borderColor: 'rgba(0, 0, 0, 0.8)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice.toFixed(2)}`,
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                color: '#fff',
                                position: 'end',
                                padding: 6
                            }
                        }
                    }
                }
            },
            layout: {
                padding: {
                    right: 50
                }
            }
        }
    });
}

// Adding event listener to handle Enter key submission
document.getElementById('stockTicker').addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        getOptionsData();
    }
});
