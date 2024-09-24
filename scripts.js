document.addEventListener('DOMContentLoaded', (event) => {
    const ctx = document.getElementById('optionsChart').getContext('2d');
    
    // Basic test chart to check if Chart.js is working
    const testChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Test 1', 'Test 2', 'Test 3'],
            datasets: [{
                label: 'Test Data',
                data: [10, 20, 30],
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});

// The rest of your code can go here after confirming the test chart works
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

        // Fetch options chain from Finnhub.io
        const optionsResponse = await fetch(`https://finnhub.io/api/v1/stock/option-chain?symbol=${ticker}&token=${apiKey}`);
        const optionsData = await optionsResponse.json();

        if (!optionsData || !optionsData.data || optionsData.data.length === 0) {
            alert("No options data available for this ticker.");
            return; 
        }

        // Extracting CALL and PUT options for the first expiration date
        const firstOption = optionsData.data[0];
        const callOptions = firstOption.options.CALL;
        const putOptions = firstOption.options.PUT;

        const minStrike = Math.floor((currentPrice - 50) / 5) * 5; 
        const maxStrike = Math.ceil((currentPrice + 50) / 5) * 5;
        const strikeRange = [];

        for (let strike = minStrike; strike <= maxStrike; strike += 2.5) {
            strikeRange.push(strike);
        }

        const strikes = callOptions.map(option => option.strike);
        const callsOI = callOptions.map(option => option.openInterest);
        const putsOI = putOptions.map(option => option.openInterest);

        const chartCallsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? callsOI[index] : 0;
        });

        const chartPutsOI = strikeRange.map(strike => {
            const index = strikes.indexOf(strike);
            return index !== -1 ? putsOI[index] : 0;
        });

        const chartData = {
            strikes: strikeRange,
            callsOI: chartCallsOI,
            putsOI: chartPutsOI
        };

        renderChart(chartData, currentPrice);
    } catch (error) {
        console.error('Error fetching data from Finnhub.io:', error);
        alert(`Error: ${error.message}`);
    }
}

function renderChart(data, currentPrice) {
    const ctx = document.getElementById('optionsChart').getContext('2d');

    if (currentChart) {
        currentChart.destroy();
    }

    currentChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.strikes,
            datasets: [
                {
                    label: 'Calls Open Interest',
                    data: data.callsOI,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Puts Open Interest',
                    data: data.putsOI,
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                x: {
                    beginAtZero: false,
                },
                y: {
                    beginAtZero: true
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
