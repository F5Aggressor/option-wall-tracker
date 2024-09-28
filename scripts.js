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

        // Define a wider range around the current price
        const minStrike = Math.max(Math.floor(currentPrice - 75), Math.min(...strikes));
        const maxStrike = Math.min(Math.ceil(currentPrice + 75), Math.max(...strikes));

        // Filter strikes within the desired range
        const limitedStrikes = strikes.filter(strike => strike >= minStrike && strike <= maxStrike);

        // Ensure calls and puts open interest arrays match the filtered strikes
        const limitedCallsOI = limitedStrikes.map(strike => {
            const index = strikes.indexOf(strike);
            return index > -1 ? callsOI[index] : 0;
        });
        const limitedPutsOI = limitedStrikes.map(strike => {
            const index = strikes.indexOf(strike);
            return index > -1 ? putsOI[index] : 0;
        });

        const chartData = {
            strikes: limitedStrikes,
            callsOI: limitedCallsOI,
            putsOI: limitedPutsOI
        };

        // Log the filtered strikes and open interests for debugging
        console.log('Filtered Strikes:', limitedStrikes);
        console.log('Filtered Calls OI:', limitedCallsOI);
        console.log('Filtered Puts OI:', limitedPutsOI);

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

    // Define the X-axis range to include the current price
    const xMin = Math.max(Math.min(...data.strikes), currentPrice - 75);
    const xMax = Math.min(Math.max(...data.strikes), currentPrice + 75);

    console.log('X-axis Range:', { xMin, xMax });

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
                    min: xMin,
                    max: xMax,
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
                            value: currentPrice,  // This should reflect the actual currentPrice
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

