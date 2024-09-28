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

        // ** Add these logs to see detailed data in the console **
        console.log('Strikes:', strikes);        // Logs the strikes array
        console.log('Calls Open Interest:', callsOI);  // Logs the calls open interest array
        console.log('Puts Open Interest:', putsOI);    // Logs the puts open interest array

        // Prepare the chart data
        renderChart({ strikes, callsOI, putsOI }, currentPrice);

    } catch (error) {
        console.error('Error:', error);
        alert(error.message);
    }
}


const xMin = Math.max(Math.min(...data.strikes), currentPrice - 75);
const xMax = Math.min(Math.max(...data.strikes), currentPrice + 75);

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
                max: xMax
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
                            color: '#fff'
                        }
                    }
                }
            }
        }
    }
});
