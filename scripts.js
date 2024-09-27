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

        if (!priceResponse.ok) {
            throw new Error("Failed to fetch stock price data");
        }

        const priceData = await priceResponse.json();
        console.log('Price Data for ticker', ticker, ':', priceData);  // Debugging log

        if (!priceData || typeof priceData.c === 'undefined') {
            throw new Error(`Failed to retrieve current price for ${ticker}`);
        }

        const currentPrice = priceData.c;

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);

        if (!optionsResponse.ok) {
            throw new Error("Failed to fetch options chain data");
        }

        const optionsData = await optionsResponse.json();
        console.log('Parsed Options Data for ticker', ticker, ':', optionsData);  // Debugging log

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return;
        }

        const firstOption = optionsData.data[0];  // First expiration date's options
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        // Extract strikes, calls open interest, and puts open interest
        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        console.log('Strikes for ticker', ticker, ':', strikes);
        console.log('Calls Open Interest:', callsOI);
        console.log('Puts Open Interest:', putsOI);

        // Expand the range even more
        const minStrike = Math.max(Math.floor(currentPrice - 75), Math.min(...strikes));
        const maxStrike = Math.min(Math.ceil(currentPrice + 75), Math.max(...strikes));

        // Filter strikes within a 75-point range around the current price
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

        // Log the limited strikes and corresponding open interest
        console.log('Filtered Strikes:', limitedStrikes);
        console.log('Filtered Calls OI:', limitedCallsOI);
        console.log('Filtered Puts OI:', limitedPutsOI);

        const chartData = {
            strikes: limitedStrikes,
            callsOI: limitedCallsOI,
            putsOI: limitedPutsOI
        };

        renderChart(chartData, currentPrice);

        document.getElementById('stockTicker').value = '';

    } catch (error) {
        console.error('Error fetching data:', error);
        alert(`Error: ${error.message}`);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    if (currentChart) {
        currentChart.destroy();
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
                            xMin: currentPrice,
                            xMax: currentPrice,
                            borderColor: 'rgba(0, 0, 0, 0.8)',
                            borderWidth: 2,
                            label: {
                                enabled: true,
                                content: `Current Price: $${currentPrice.toFixed(2)}`,
                                backgroundColor: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                position: 'end',
                                padding: 6,
                                xAdjust: 0,
                                yAdjust: 20
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

// Adjust canvas size if needed
const canvas = document.getElementById('optionsChart');
canvas.width = 1000;
canvas.height = 500;


